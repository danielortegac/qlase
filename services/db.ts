
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, setDoc, deleteDoc, query, where, writeBatch, arrayUnion, arrayRemove, onSnapshot, orderBy, increment } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { User, Course, MarketplaceCourse, Publication, UserRole, Material, Assignment, Recording, Message, Diploma, Notification, Report } from '../types';
import { MOCK_COURSES, STORAGE_LIMITS, AI_COSTS } from '../constants';

const USERS_COLLECTION = 'users';
const COURSES_COLLECTION = 'courses';
const MARKETPLACE_COLLECTION = 'marketplace';
const RESEARCH_COLLECTION = 'publications';
const MESSAGES_COLLECTION = 'messages';
const NOTIFICATIONS_COLLECTION = 'notifications';
const REPORTS_COLLECTION = 'reports';

export const DatabaseService = {
  async initializeSystem(): Promise<void> {
    try {
      const coursesSnap = await getDocs(collection(db, COURSES_COLLECTION));
      if (coursesSnap.empty) {
        const batch = writeBatch(db);
        MOCK_COURSES.forEach(c => {
          const ref = doc(collection(db, COURSES_COLLECTION));
          batch.set(ref, { ...c, id: ref.id, createdAt: Date.now() });
        });
        await batch.commit();
      }
    } catch (error) {
      console.error("GO Cloud Error: Initialization failed", error);
    }
  },

  async deductCredits(userId: string, amount: number): Promise<boolean> {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return false;
      const userData = userDoc.data() as User;
      const currentCredits = userData.aiCredits ?? 0;
      if (currentCredits < amount) return false;
      await updateDoc(userRef, { aiCredits: currentCredits - amount });
      return true;
  },

  async checkAndResetCredits(user: User): Promise<User> {
      const now = new Date();
      const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset) : new Date(0);
      
      let shouldReset = false;
      let newCredits = user.aiCredits ?? 0;

      if (user.isPremium) {
          const isDifferentDay = now.toDateString() !== lastReset.toDateString();
          if (isDifferentDay) {
              shouldReset = true;
              newCredits = AI_COSTS.PRO_DAILY_LIMIT;
          }
      } else {
          const isDifferentMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
          if (isDifferentMonth) {
              shouldReset = true;
              newCredits = AI_COSTS.FREE_MONTHLY_LIMIT;
          }
      }

      if (shouldReset) {
          const userRef = doc(db, USERS_COLLECTION, user.id);
          const updatedData = { 
              aiCredits: newCredits, 
              lastCreditReset: Date.now() 
          };
          await updateDoc(userRef, updatedData);
          return { ...user, ...updatedData };
      }
      return user;
  },

  async loginUser(email: string, password: string): Promise<User> {
      const normalizedEmail = email.toLowerCase().trim();
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, USERS_COLLECTION, uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
          const user = { id: uid, ...userDoc.data() } as User;
          return await this.checkAndResetCredits(user);
      } else {
          throw new Error("Perfil de usuario no encontrado en base de datos.");
      }
  },

  async registerUser(email: string, password: string, name: string, role: UserRole): Promise<User> {
      const normalizedEmail = email.toLowerCase().trim();
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", normalizedEmail));
      const snap = await getDocs(q);
      let existingData: any = {};
      let shadowDocRef: any = null; 

      if (!snap.empty) {
          const shadowDoc = snap.docs[0];
          existingData = shadowDoc.data();
          shadowDocRef = shadowDoc.ref;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const uid = userCredential.user.uid;

      const newUser: User = {
        id: uid,
        name: name,
        email: normalizedEmail,
        role: role,
        avatar: `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`,
        premiumLanguage: false,
        isPremium: false,
        status: 'active',
        walletBalance: role === UserRole.TEACHER ? 0 : 100,
        pendingBalance: 0,
        storageUsed: 0,
        storageLimit: STORAGE_LIMITS.FREE,
        ownedCourseIds: existingData.ownedCourseIds || [], 
        bio: "",
        phone: "",
        location: "",
        title: "",
        whatsapp: "",
        socialProfiles: { researchGate: '', googleScholar: '', linkedIn: '', twitter: '' },
        aiCredits: AI_COSTS.FREE_MONTHLY_LIMIT,
        lastCreditReset: Date.now()
      };

      await setDoc(doc(db, USERS_COLLECTION, uid), newUser);
      if (shadowDocRef) await deleteDoc(shadowDocRef);
      return newUser;
  },

  async deleteAccount(userId: string): Promise<void> {
      try {
          await deleteDoc(doc(db, USERS_COLLECTION, userId));
          if (auth.currentUser) await auth.currentUser.delete();
      } catch (e) { console.error("Error deleting account", e); }
  },

  async updateUserProfile(user: User): Promise<void> {
     const userRef = doc(db, USERS_COLLECTION, user.id);
     const { id, ...userData } = user; 
     await updateDoc(userRef, userData as any);
  },

  async getUserById(uid: string): Promise<User | null> {
      const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
  },

  subscribeToUser(userId: string, callback: (user: User) => void): () => void {
      return onSnapshot(doc(db, USERS_COLLECTION, userId), (doc) => {
          if (doc.exists()) {
              callback({ id: doc.id, ...doc.data() } as User);
          }
      });
  },

  async sendNotificationToUser(userId: string, data: Omit<Notification, 'id' | 'date' | 'read'>): Promise<void> {
      await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
          ...data,
          userId,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          read: false
      });
  },

  async broadcastNotificationToCourse(courseId: string, data: Omit<Notification, 'id' | 'date' | 'read'>): Promise<void> {
      const course = await this.getCourseById(courseId);
      if (!course || !course.students) return;
      const batch = writeBatch(db);
      course.students.forEach(studentId => {
          const ref = doc(collection(db, NOTIFICATIONS_COLLECTION));
          batch.set(ref, {
              ...data,
              userId: studentId,
              date: new Date().toLocaleDateString(),
              timestamp: Date.now(),
              read: false,
              actionLink: courseId
          });
      });
      await batch.commit();
  },

  subscribeToNotifications(userId: string, callback: (notifs: Notification[]) => void): () => void {
      const q = query(collection(db, NOTIFICATIONS_COLLECTION), where("userId", "==", userId));
      return onSnapshot(q, (snap) => {
          const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
          notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          callback(notifications);
      });
  },

  async markNotificationRead(notifId: string): Promise<void> {
      await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notifId), { read: true });
  },

  async getUsersByIds(userIds: string[]): Promise<User[]> {
      if (!userIds || userIds.length === 0) return [];
      const users: User[] = [];
      const q = query(collection(db, USERS_COLLECTION), where('id', 'in', userIds.slice(0, 10)));
      const snap = await getDocs(q);
      snap.forEach(d => users.push({ id: d.id, ...d.data() } as User));
      return users;
  },

  async getAllUsers(): Promise<User[]> {
      const snap = await getDocs(collection(db, USERS_COLLECTION));
      return snap.docs.map(d => ({id: d.id, ...d.data()} as User));
  },

  async findUserByEmail(email: string): Promise<User | null> {
      const normalizedEmail = email.toLowerCase().trim();
      const q = query(collection(db, USERS_COLLECTION), where("email", "==", normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
          const doc = snap.docs[0];
          return { id: doc.id, ...doc.data() } as User;
      }
      return null;
  },

  async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
     const cleanData = JSON.parse(JSON.stringify(courseData));
     const ref = await addDoc(collection(db, COURSES_COLLECTION), { ...cleanData, createdAt: Date.now() });
     return ref.id;
  },

  async updateCourseDetails(courseId: string, details: Partial<Course>): Promise<void> {
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), JSON.parse(JSON.stringify(details)));
  },

  async deleteCourse(courseId: string): Promise<void> {
      await deleteDoc(doc(db, COURSES_COLLECTION, courseId));
  },
  
  async getCourses(): Promise<Course[]> {
      const snapshot = await getDocs(collection(db, COURSES_COLLECTION));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Course)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    const docSnap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Course : null;
  },

  async trackAssignmentView(courseId: string, assignmentId: string, studentId: string): Promise<void> {
      const courseSnap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
      if (!courseSnap.exists()) return;
      const course = courseSnap.data() as Course;
      const updatedAssignments = course.assignments.map(a => {
          if (a.id === assignmentId) {
              const viewedBy = a.viewedBy || [];
              if (!viewedBy.includes(studentId)) {
                  return { ...a, viewedBy: [...viewedBy, studentId] };
              }
          }
          return a;
      });
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), { assignments: updatedAssignments });
  },

  async addMaterial(courseId: string, material: Material, fileSize: number = 0): Promise<void> {
    await updateDoc(doc(db, COURSES_COLLECTION, courseId), { materials: arrayUnion(material) });
    const course = await this.getCourseById(courseId);
    if (course && course.instructorId && fileSize > 0) {
        // EL DOCENTE PAGA POR SU PROPIO MATERIAL
        await updateDoc(doc(db, USERS_COLLECTION, course.instructorId), { storageUsed: increment(fileSize) });
    }
  },

  async addAssignment(courseId: string, assignment: Assignment): Promise<void> {
    await updateDoc(doc(db, COURSES_COLLECTION, courseId), { assignments: arrayUnion(JSON.parse(JSON.stringify(assignment))) });
    await this.broadcastNotificationToCourse(courseId, {
        title: "Nueva Tarea Asignada",
        message: `Se ha publicado una nueva entrega: ${assignment.title}`,
        type: 'deadline'
    });
  },

  async submitAssignment(courseId: string, assignmentId: string, studentId: string, fileUrls: string[], fileSize: number = 0): Promise<void> {
      const courseSnap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
      if(!courseSnap.exists()) return;
      const course = courseSnap.data() as Course;
      const assignment = course.assignments.find(a => a.id === assignmentId);
      const student = await this.getUserById(studentId);

      const updatedAssignments = course.assignments.map(a => a.id === assignmentId ? { 
          ...a, 
          submissions: { ...a.submissions, [studentId]: 'submitted' },
          submissionContent: { ...a.submissionContent, [studentId]: fileUrls },
          submissionDate: { ...a.submissionDate, [studentId]: new Date().toISOString() }
      } : a);
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), { assignments: updatedAssignments });

      if (course.instructorId) {
          if (fileSize > 0) {
            // LÓGICA CRÍTICA: EL ALUMNO SUBE, EL DOCENTE PAGA CON SU ALMACENAMIENTO (Solicitado por el usuario)
            await updateDoc(doc(db, USERS_COLLECTION, course.instructorId), { storageUsed: increment(fileSize) });
          }
          await this.sendNotificationToUser(course.instructorId, {
            title: "Nueva entrega recibida",
            message: `${student?.name || 'Un estudiante'} ha subido su tarea: ${assignment?.title || 'Tarea'}`,
            type: 'grade',
            actionLink: courseId
          });
      }
  },

  async updateAssignmentGrade(courseId: string, assignmentId: string, grades: Record<string, number>, comments: Record<string, string>): Promise<void> {
     const courseSnap = await getDoc(doc(db, COURSES_COLLECTION, courseId));
     if(!courseSnap.exists()) return;
     const course = courseSnap.data() as Course;
     const updatedAssignments = course.assignments.map(a => a.id === assignmentId ? { ...a, grades: grades, teacherComments: comments, status: 'graded' } : a);
     await updateDoc(doc(db, COURSES_COLLECTION, courseId), { assignments: updatedAssignments });

     for (const studentId of Object.keys(grades)) {
         await this.sendNotificationToUser(studentId, {
             title: "Tarea Calificada",
             message: `Tu tarea para "${course.title}" ha sido revisada por el docente.`,
             type: 'grade',
             actionLink: courseId
         });
     }
  },

  async addRecording(courseId: string, recording: Recording, fileSize: number = 0): Promise<void> {
    await updateDoc(doc(db, COURSES_COLLECTION, courseId), { recordings: arrayUnion(recording) });
    const course = await this.getCourseById(courseId);
    if (course && course.instructorId && fileSize > 0) {
        await updateDoc(doc(db, USERS_COLLECTION, course.instructorId), { storageUsed: increment(fileSize) });
    }
  },

  async addDiplomasToCourse(courseId: string, files: File[]): Promise<void> {
      const newDiplomas: Diploma[] = files.map(file => ({
          id: `dip_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          studentName: file.name.replace(/\.[^/.]+$/, ""),
          fileUrl: "#",
          publicLink: `${window.location.origin}${window.location.pathname}?view=diploma&id=dip_${Date.now()}`,
          issueDate: new Date().toLocaleDateString()
      }));
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), { diplomas: arrayUnion(...newDiplomas) });
  },

  async getDiplomaById(diplomaId: string): Promise<{diploma: Diploma, course: Course} | null> {
      const courses = await this.getCourses();
      for (const course of courses) {
          const found = course.diplomas?.find(d => d.id === diplomaId);
          if (found) return { diploma: found, course: course };
      }
      return null;
  },

  async batchAddStudentsToCourse(courseId: string, rawLines: string[]): Promise<{ validUsers: User[], ignoredEmails: string[] }> {
      const ids: string[] = [];
      const processed: User[] = [];
      const course = await this.getCourseById(courseId);
      
      for (const line of rawLines) {
          const email = line.split(',')[0].trim().toLowerCase();
          if (!email) continue;
          
          let user = await this.findUserByEmail(email);
          let targetUserId = "";

          if (user) {
              targetUserId = user.id;
              ids.push(user.id);
              processed.push(user);
              await updateDoc(doc(db, USERS_COLLECTION, user.id), { 
                  ownedCourseIds: arrayUnion(courseId) 
              });
          } else {
              const newId = `invited_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              targetUserId = newId;
              const newUser: User = {
                id: newId,
                name: email.split('@')[0],
                email: email,
                role: UserRole.STUDENT,
                avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random&color=fff`,
                status: 'invited',
                ownedCourseIds: [courseId],
                walletBalance: 0,
                storageUsed: 0,
                storageLimit: 1024 * 1024 * 1024,
                aiCredits: 10,
                lastCreditReset: Date.now()
              };
              
              await setDoc(doc(db, USERS_COLLECTION, newId), newUser);
              ids.push(newId);
              processed.push(newUser);
          }

          await this.sendNotificationToUser(targetUserId, {
            title: "Nuevo curso asignado",
            message: `Has sido matriculado en el curso: ${course?.title || 'Nueva Clase'}. ¡Bienvenido!`,
            type: 'invite',
            actionLink: courseId
          });
      }
      
      if (ids.length > 0) {
          await updateDoc(doc(db, COURSES_COLLECTION, courseId), { 
              students: arrayUnion(...ids) 
          });
      }
      
      return { validUsers: processed, ignoredEmails: [] };
  },

  async removeStudentFromCourse(courseId: string, studentId: string): Promise<void> {
      await updateDoc(doc(db, COURSES_COLLECTION, courseId), { students: arrayRemove(studentId) });
      await updateDoc(doc(db, USERS_COLLECTION, studentId), { ownedCourseIds: arrayRemove(courseId) });
  },

  async getMarketplaceItems(): Promise<MarketplaceCourse[]> {
    const snap = await getDocs(collection(db, MARKETPLACE_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MarketplaceCourse));
  },

  async getMarketplaceCourseById(id: string): Promise<MarketplaceCourse | null> {
      const docSnap = await getDoc(doc(db, MARKETPLACE_COLLECTION, id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as MarketplaceCourse : null;
  },

  async addMarketplaceCourse(course: MarketplaceCourse): Promise<void> {
      await setDoc(doc(db, MARKETPLACE_COLLECTION, course.id), course);
  },

  async updateMarketplaceCourse(courseId: string, data: Partial<MarketplaceCourse>): Promise<void> {
      await updateDoc(doc(db, MARKETPLACE_COLLECTION, courseId), data);
  },

  async deleteMarketplaceCourse(courseId: string): Promise<void> {
      await deleteDoc(doc(db, MARKETPLACE_COLLECTION, courseId));
  },

  async purchaseCourse(userId: string, courseId: string, price: number, instructorId?: string): Promise<boolean> {
      return true;
  },

  async getPublications(): Promise<Publication[]> {
    const snap = await getDocs(collection(db, RESEARCH_COLLECTION));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Publication));
  },

  async getPublicationById(id: string): Promise<Publication | null> {
      const q = query(collection(db, RESEARCH_COLLECTION), where("id", "==", id));
      const snap = await getDocs(q);
      if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() } as Publication;
      }
      return null;
  },

  async uploadPaper(paper: Publication, fileSize: number = 0): Promise<void> {
    await addDoc(collection(db, RESEARCH_COLLECTION), paper);
    if (paper.authorId && fileSize > 0) {
        await updateDoc(doc(db, USERS_COLLECTION, paper.authorId), { storageUsed: increment(fileSize) });
    }
  },

  async deletePublication(id: string): Promise<void> {
      const q = query(collection(db, RESEARCH_COLLECTION), where("id", "==", id));
      const snap = await getDocs(q);
      if (!snap.empty) {
          await deleteDoc(snap.docs[0].ref);
      }
  },

  async sendReport(report: Omit<Report, 'id' | 'timestamp'>): Promise<void> {
      await addDoc(collection(db, REPORTS_COLLECTION), {
          ...report,
          timestamp: Date.now()
      });
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
      await addDoc(collection(db, MESSAGES_COLLECTION), { senderId, receiverId, content, timestamp: Date.now(), read: false });
  },

  async getMessages(userId: string): Promise<Message[]> {
      const q = query(collection(db, MESSAGES_COLLECTION));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)).filter(m => m.senderId === userId || m.receiverId === userId).sort((a,b) => a.timestamp - b.timestamp);
  }
};
