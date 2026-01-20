import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import GradeCard from "@/components/GradeCard";
import SubjectCard from "@/components/SubjectCard";
import StandardCard from "@/components/StandardCard";
import Grade6StandardsView from "@/components/Grade6StandardsView";
import TeacherSelector from "@/components/TeacherSelector";
import StudentSelector from "@/components/StudentSelector";
import ParentLogin from "@/components/ParentLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { grades, getSubjectsByGrade, getStandardsBySubject, getGradeById, getSubjectById } from "@/data/standards";
import { ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import trainingIcon from "@/assets/training-icon.gif";
import familyIcon from "@/assets/family-icon.png";

import { teacherData } from "@/data/classData";
import { supabase } from "@/integrations/supabase/client";

type NavigationState = {
  selectedGrade: string | null;
  selectedSubject: string | null;
  selectedTeacher: boolean;
  selectedStudent: string | null;
  userType: "teacher" | "parent" | null;
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const restoreState = (location.state ?? null) as Partial<NavigationState> | null;

  const [selectedGrade, setSelectedGrade] = useState<string | null>(restoreState?.selectedGrade ?? null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(restoreState?.selectedSubject ?? null);
  const [selectedTeacher, setSelectedTeacher] = useState<boolean>(restoreState?.selectedTeacher ?? false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(restoreState?.selectedStudent ?? null);
  const [userType, setUserType] = useState<"teacher" | "parent" | null>(restoreState?.userType ?? null);

  const subjects = selectedGrade ? getSubjectsByGrade(selectedGrade) : [];
  const standards = selectedSubject ? getStandardsBySubject(selectedSubject) : [];
  const currentGrade = selectedGrade ? getGradeById(selectedGrade) : null;
  const currentSubject = selectedSubject ? getSubjectById(selectedSubject) : null;

  // Check if this grade+subject has teacher/student selection
  const hasClassData = selectedSubject ? !!teacherData[selectedSubject] : false;
  const teacher = hasClassData && selectedSubject ? teacherData[selectedSubject] : null;

  // Fetch students from Supabase based on selected grade
  const [classStudents, setClassStudents] = useState<string[]>([]);
  
  const normalizeGrade = (grade: string) => {
    if (grade.startsWith("grade-")) return grade.replace("grade-", "");
    return grade;
  };

  useEffect(() => {
    if (selectedSubject && hasClassData && selectedGrade) {
      const fetchStudents = async () => {
        const gradeNumber = normalizeGrade(selectedGrade);
        try {
          // Use edge function to get students for teachers (secure approach)
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-students-by-grade?grade=${encodeURIComponent(selectedGrade)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );

          const result = await response.json();

          if (result.success && result.students) {
            setClassStudents(result.students.map((s: { student_name: string }) => s.student_name));
          }
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };
      fetchStudents();
    }
  }, [selectedSubject, hasClassData, selectedGrade]);

  const handleBack = () => {
    if (userType === "parent" && selectedStudent) {
      setSelectedStudent(null);
    } else if (userType === "parent") {
      setUserType(null);
    } else if (hasClassData && selectedStudent) {
      setSelectedStudent(null);
    } else if (hasClassData && selectedTeacher) {
      setSelectedTeacher(false);
    } else if (selectedSubject) {
      setSelectedSubject(null);
      setSelectedTeacher(false);
      setSelectedStudent(null);
    } else if (userType) {
      setUserType(null);
    } else if (selectedGrade) {
      setSelectedGrade(null);
      setUserType(null);
    }
  };

  const handleStartQuiz = (standardId: string, subIndicatorId?: string) => {
    const navigationState: NavigationState = {
      selectedGrade,
      selectedSubject,
      selectedTeacher,
      selectedStudent,
      userType,
    };

    if (subIndicatorId) {
      navigate(`/quiz/${standardId}?subIndicator=${subIndicatorId}`, { state: navigationState });
    } else {
      navigate(`/quiz/${standardId}`, { state: navigationState });
    }
  };

  // التحقق مما إذا كان الموضوع يحتاج عرض خاص (لغتي أو الرياضيات أو العلوم للصف السادس | رياضيات ولغتي الصف الثالث)
  const isGrade6Arabic = selectedSubject === "reading-6";
  const isGrade6Math = selectedSubject === "math-6";
  const isGrade6Science = selectedSubject === "science-6";
  const isGrade3Math = selectedSubject === "math-3";
  const isGrade3Arabic = selectedSubject === "reading-3";
  const showCollapsibleView = isGrade6Arabic || isGrade6Math || isGrade6Science || isGrade3Math || isGrade3Arabic;

  return (
    <div 
      className="min-h-screen bg-background bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/images/nafs-background.jpeg')" }}
    >
      {/* طبقة شفافة لتحسين قراءة المحتوى */}
      <div className="min-h-screen bg-background/85 dark:bg-background/90">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* مسار التنقل */}
        {(selectedGrade || selectedSubject) && (
          <div className="mb-6 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4 ml-1" />
              رجوع
            </Button>
            <span className="text-muted-foreground">/</span>
            {currentGrade && <span className="text-foreground font-medium">{currentGrade.name}</span>}
            {currentSubject && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">{currentSubject.name}</span>
              </>
            )}
          </div>
        )}

        {/* اختيار الصف */}
        {!selectedGrade && (
          <div className="animate-fade-in">
            <div className="text-center mb-6 md:mb-10">
              <img src={logo} alt="شعار وزارة التعليم" className="h-40 md:h-56 lg:h-64 mx-auto mb-3 md:mb-4" />
              <h1 className="text-xl md:text-3xl font-bold text-primary mb-3 md:mb-6">اختبارات محاكاة نافس 2026</h1>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-3">اختر الصف الدراسي</h2>
              <p className="text-muted-foreground text-sm md:text-base">حدد الصف لبدء الاختبارات المحاكية.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
              {grades.map((grade) => (
                <GradeCard
                  key={grade.id}
                  grade={grade}
                  onClick={() => setSelectedGrade(grade.id)}
                />
              ))}
            </div>
            
            {/* زر شواهد التدريب */}
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/training-gallery")}
                className="border-primary/50 hover:border-primary hover:bg-primary/10 gap-2"
              >
                <img src={trainingIcon} alt="" className="w-6 h-6 object-contain" />
                شواهد التدريب
              </Button>
            </div>

          </div>
        )}

        {/* اختيار نوع المستخدم (طالب أو ولي أمر) */}
        {selectedGrade && !userType && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-3">نوع الدخول</h2>
              <p className="text-muted-foreground">{currentGrade?.name}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card 
                className="cursor-pointer card-hover border-2 border-border hover:border-primary bg-card"
                onClick={() => setUserType("teacher")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <img src={trainingIcon} alt="معلم" className="w-16 h-16 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">معلم</h3>
                  <p className="text-muted-foreground text-sm">التدريب على الاختبارات</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer card-hover border-2 border-border hover:border-secondary bg-card"
                onClick={() => setUserType("parent")}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <img src={familyIcon} alt="ولي أمر" className="w-16 h-16 object-contain" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">ولي أمر</h3>
                  <p className="text-muted-foreground text-sm">اختبار الطالب وحفظ تقدمه</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* دخول ولي الأمر */}
        {selectedGrade && userType === "parent" && !selectedStudent && (
          <ParentLogin
            grade={selectedGrade}
            gradeName={currentGrade?.name || ""}
            onBack={() => setUserType(null)}
            onSuccess={(studentName, studentId) => {
              setSelectedStudent(studentName);
              sessionStorage.setItem('selectedStudent', studentName);
              sessionStorage.setItem('selectedStudentId', studentId);
            }}
          />
        )}

        {/* اختيار المادة - للمعلم أو ولي الأمر بعد اختيار الطالب */}
        {selectedGrade && ((userType === "teacher") || (userType === "parent" && selectedStudent)) && !selectedSubject && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              {userType === "parent" && selectedStudent && (
                <div className="mb-4 bg-primary/10 rounded-lg p-3 inline-block">
                  <p className="text-muted-foreground text-sm">الطالب:</p>
                  <p className="text-primary font-bold">{selectedStudent}</p>
                </div>
              )}
              <h2 className="text-3xl font-bold text-foreground mb-3">اختر المادة</h2>
              <p className="text-muted-foreground">{currentGrade?.name}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onClick={() => setSelectedSubject(subject.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* اختيار المعلم - فقط للصف الثالث رياضيات */}
        {selectedSubject && hasClassData && !selectedTeacher && (
          <TeacherSelector 
            teacherName={teacher!.name}
            teacherSubject={teacher!.subject}
            onSelect={() => setSelectedTeacher(true)} 
          />
        )}

        {/* اختيار الطالب */}
        {selectedSubject && hasClassData && selectedTeacher && !selectedStudent && classStudents.length > 0 && (
          <StudentSelector 
            students={classStudents} 
            onSelect={(student) => setSelectedStudent(student)} 
          />
        )}

        {/* عرض المعايير */}
        {selectedSubject && (!hasClassData || (selectedTeacher && selectedStudent)) && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              {selectedStudent && (
                <div className="mb-4 bg-primary/10 rounded-lg p-3 inline-block">
                  <p className="text-muted-foreground text-sm">الطالب:</p>
                  <p className="text-primary font-bold">{selectedStudent}</p>
                </div>
              )}
              <h2 className="text-3xl font-bold text-foreground mb-3">معايير {currentSubject?.name}</h2>
              <p className="text-muted-foreground">اختر المعيار لبدء الاختبار</p>
            </div>
            
            {/* عرض خاص لمعايير لغتي والرياضيات للصف السادس مع المؤشرات الفرعية */}
            {showCollapsibleView ? (
              <div className="max-w-3xl mx-auto">
                <Grade6StandardsView 
                  standards={standards} 
                  onStartQuiz={handleStartQuiz}
                />
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl mx-auto">
                {standards.map((standard, index) => (
                  <StandardCard
                    key={standard.id}
                    standard={standard}
                    index={index}
                    onClick={() => handleStartQuiz(standard.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-muted-foreground border-t border-border/50 mt-12">
        <p>ابتدائية سعد بن أبي وقاص © {new Date().getFullYear()}</p>
      </footer>
      </div>
    </div>
  );
};

export default Index;
