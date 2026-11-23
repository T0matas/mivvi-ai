import { Box, Typography } from '@mui/material';
import { MenuBookOutlined, SchoolOutlined, EditOutlined, LocalFireDepartmentOutlined, EmojiEventsOutlined, Bolt, Check } from '@mui/icons-material';
import { ReactNode, useState } from 'react';
import { t } from '../utils/translations';
import { soundManager } from '../utils/soundEffects';
import Mascot from './Mascot';
import { cv } from '../theme';

// Missions as a Codevantum page: title and lede, a segmented control, and one
// quiet list (School.css .sc-list) with a hairline between rows.

interface MissionsProps {
    language?: string;
    gems?: number;
    dailyXP?: number;
    dailyLessons?: number;
    dailyPerfectLessons?: number;
    weeklyXP?: number;
    streak?: number;
    claimedMissionIds?: string[];
    onClaimReward: (amount: number, missionId: string) => void;
}

interface Mission {
    id: string;
    titleKey: string;
    descKey: string;
    progress: number;
    total: number;
    reward: number;
    type: 'daily' | 'weekly';
    icon: ReactNode;
    color: string;
}

const COPY: Record<string, { title: string; lede: string; daily: string; weekly: string; claim: string; claimed: string; allDone: string; gems: string }> = {
    pt: { title: 'Missões', lede: 'Pequenos objetivos para manter o ritmo. Cada um dá XP.', daily: 'Hoje', weekly: 'Esta semana', claim: 'Receber', claimed: 'Recebido', allDone: 'Fizeste tudo por agora. Volta amanhã!', gems: 'gemas' },
    en: { title: 'Missions', lede: 'Small goals to keep your rhythm. Each one earns XP.', daily: 'Today', weekly: 'This week', claim: 'Claim', claimed: 'Claimed', allDone: 'All done for now. Come back tomorrow!', gems: 'gems' },
    es: { title: 'Misiones', lede: 'Pequeños objetivos para mantener el ritmo. Cada uno da XP.', daily: 'Hoy', weekly: 'Esta semana', claim: 'Recibir', claimed: 'Recibido', allDone: '¡Todo hecho por ahora. Vuelve mañana!', gems: 'gemas' },
};

export default function Missions({ language = 'pt-BR', dailyXP = 0, dailyLessons = 0, dailyPerfectLessons = 0, weeklyXP = 0, streak = 0, claimedMissionIds = [], onClaimReward }: MissionsProps) {
    const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
    const copy = COPY[language.slice(0, 2)] || COPY.en;

    const missions: Mission[] = [
        { id: 'd1', titleKey: 'mission_complete_lesson', descKey: 'mission_complete_lesson_desc', progress: dailyLessons, total: 3, reward: 50, type: 'daily', icon: <MenuBookOutlined />, color: cv.butter },
        { id: 'd2', titleKey: 'mission_earn_xp', descKey: 'mission_earn_xp_desc', progress: dailyXP, total: 200, reward: 30, type: 'daily', icon: <SchoolOutlined />, color: '#9fc9ff' },
        { id: '2', titleKey: 'mission_perfect_lesson', descKey: 'mission_perfect_lesson_desc', progress: dailyPerfectLessons, total: 1, reward: 20, type: 'daily', icon: <EditOutlined />, color: cv.mint },
        { id: 'w1', titleKey: 'mission_perfect_week', descKey: 'mission_perfect_week_desc', progress: streak, total: 7, reward: 500, type: 'weekly', icon: <LocalFireDepartmentOutlined />, color: cv.coral },
        { id: '3', titleKey: 'mission_weekly_scholar', descKey: 'mission_weekly_scholar_desc', progress: weeklyXP, total: 500, reward: 100, type: 'weekly', icon: <EmojiEventsOutlined />, color: '#ff9fbb' },
    ];
    const list = missions.filter((m) => m.type === tab);
    const open = missions.filter((m) => !claimedMissionIds.includes(m.id));
    const ready = open.filter((m) => m.progress >= m.total).length;

    return (
        <Box component="main" sx={{ maxWidth: 720, mx: 'auto', px: 2.5, pt: { xs: 3, sm: 5 }, pb: 4, boxSizing: 'border-box', textAlign: 'left', color: cv.text }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3.5 }}>
                <Box>
                    <Typography component="h1" sx={{ fontFamily: cv.display, fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15 }}>{copy.title}</Typography>
                    <Typography sx={{ color: cv.muted, mt: 1 }}>{copy.lede}</Typography>
                </Box>

            </Box>

            {/* Segmented control */}
            <Box role="tablist" sx={{ display: 'inline-flex', gap: '4px', p: '4px', mb: 2, borderRadius: 999, bgcolor: cv.paper, boxShadow: `inset 0 0 0 1px ${cv.border}` }}>
                {(['daily', 'weekly'] as const).map((key) => {
                    const count = missions.filter((m) => m.type === key && !claimedMissionIds.includes(m.id) && m.progress >= m.total).length;
                    return (
                        <Box key={key} component="button" role="tab" aria-selected={tab === key} onClick={() => { soundManager.playClick(); setTab(key); }}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 32, px: 2, border: 0, borderRadius: 999, font: 'inherit', fontSize: 14, cursor: 'pointer', color: tab === key ? cv.text : cv.muted, bgcolor: tab === key ? cv.surface : 'transparent', transition: 'background-color .15s, color .15s' }}>
                            {copy[key]}
                            {count > 0 && <Box component="span" sx={{ minWidth: 18, height: 18, px: 0.5, borderRadius: 999, bgcolor: cv.accent, color: '#0d0d0d', fontSize: 11, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{count}</Box>}
                        </Box>
                    );
                })}
            </Box>

            {/* List */}
            <Box sx={{ border: `1px solid ${cv.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                {list.map((m, i) => {
                    const claimed = claimedMissionIds.includes(m.id);
                    const value = Math.min(m.progress, m.total);
                    const complete = value >= m.total;
                    return (
                        <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.75, px: 2.25, py: 2, borderTop: i ? `1px solid ${cv.border}` : 0, opacity: claimed ? 0.55 : 1, animation: `cvRow .3s ease-out ${i * 0.04}s both`, '@keyframes cvRow': { from: { opacity: 0, transform: 'translateY(4px)' } } }}>
                            <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: m.color, color: '#171725', '& svg': { fontSize: 20 } }}>
                                {m.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 500, fontSize: 15 }}>{t(m.titleKey as any, language)}</Typography>
                                <Typography sx={{ color: cv.muted, fontSize: 13, mt: 0.25 }}>{t(m.descKey as any, language)}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mt: 1.25 }}>
                                    <Box sx={{ flex: 1, height: 3, borderRadius: 999, bgcolor: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                                        <Box sx={{ width: `${(value / m.total) * 100}%`, height: '100%', bgcolor: complete ? cv.green : m.color, borderRadius: 999, transition: 'width .4s ease' }} />
                                    </Box>
                                    <Typography component="span" sx={{ fontSize: 12, color: cv.muted, fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}>{value}/{m.total}</Typography>
                                </Box>
                            </Box>
                            {claimed ? (
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: cv.muted, flexShrink: 0 }}><Check sx={{ fontSize: 16 }} />{copy.claimed}</Box>
                            ) : complete ? (
                                <Box component="button" onClick={() => { soundManager.playSuccess(); onClaimReward(m.reward, m.id); }}
                                    sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 34, px: 1.75, border: 0, borderRadius: 999, bgcolor: '#fff', color: '#0d0d0d', font: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', '&:hover': { bgcolor: '#e6e6e6' } }}>
                                    {copy.claim} +{m.reward} XP
                                </Box>
                            ) : (
                                <Box sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.5, height: 30, px: 1.25, borderRadius: 999, boxShadow: `inset 0 0 0 1px ${cv.border}`, fontSize: 13, color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>
                                    <Bolt sx={{ fontSize: 14, color: cv.butter }} />{m.reward} XP
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Mivvi, cheering when something is ready */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, color: cv.muted, fontSize: 14 }}>
                <Mascot size={44} mood={ready ? 'happy' : open.length ? 'idle' : 'celebrating'} />
                <span>{ready ? `${ready} ${ready === 1 ? 'missão pronta' : 'missões prontas'} para receber.` : open.length ? 'Faz uma lição para avançar nas missões.' : copy.allDone}</span>
            </Box>
        </Box>
    );
}
