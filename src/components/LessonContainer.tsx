import { useParams, Navigate } from 'react-router-dom';
import Lesson from './Lesson';
import { UserProfile } from '../types';

interface LessonContainerProps {
    onComplete: (xpGained: number, correct: number, total: number, gemsEarned?: number, subject?: string) => void;
    onMistake: () => void;
    onBack: (skipTutorial?: boolean) => void;
    userProfile: UserProfile | null;
    currentOutfit?: string;
    isTutorial?: boolean;
    completedLessons: number[];
}

export default function LessonContainer({ onComplete, onMistake, onBack, userProfile, currentOutfit, isTutorial, completedLessons }: LessonContainerProps) {
    const { id } = useParams();
    const lessonId = id ? parseInt(id, 10) : null;

    if (!lessonId || isNaN(lessonId)) {
        // If invalid ID, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <Lesson
            lessonId={lessonId}
            onComplete={onComplete}
            onMistake={onMistake}
            onBack={onBack}
            userProfile={userProfile}
            currentOutfit={currentOutfit}
            isTutorial={isTutorial}
            isReplay={completedLessons.includes(lessonId)}
        />
    );
}
