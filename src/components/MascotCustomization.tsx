import { Dialog, Box, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Close, Diamond, Check, LockOutlined } from '@mui/icons-material';
import Mascot, { MASCOT_NAME } from './Mascot';
import { t } from '../utils/translations';
import { soundManager } from '../utils/soundEffects';
import { useState, useEffect } from 'react';
import { cv } from '../theme';

interface MascotCustomizationProps {
    open: boolean;
    onClose: () => void;
    onSave: (outfitId: string) => void;
    currentOutfit: string;
    language?: string;
    gems: number;
    unlockedOutfits: string[];
    onPurchase?: (outfitId: string, cost: number) => boolean;
}

// Each accessory gets one of Codevantum's pastel tiles behind it.
const OUTFITS = [
    { id: 'naked', cost: 0, translationKey: 'outfit_default', color: '#3a3a3a' },
    { id: 'scientist', cost: 200, translationKey: 'outfit_scientist', color: '#9fc9ff' },
    { id: 'artist', cost: 200, translationKey: 'outfit_artist', color: '#ff9fbb' },
    { id: 'athlete', cost: 200, translationKey: 'outfit_athlete', color: cv.coral },
    { id: 'chef', cost: 200, translationKey: 'outfit_chef', color: cv.butter },
    { id: 'pirate', cost: 300, translationKey: 'outfit_pirate', color: cv.mint },
    { id: 'detective', cost: 300, translationKey: 'outfit_detective', color: '#e8c9a6' },
    { id: 'astronaut', cost: 500, translationKey: 'outfit_astronaut', color: '#b9c3ff' },
    { id: 'wizard', cost: 500, translationKey: 'outfit_wizard', color: '#c9b8ff' },
];

export default function MascotCustomization({
    open,
    onClose,
    onSave,
    currentOutfit,
    language = 'pt-BR',
    gems,
    unlockedOutfits,
    onPurchase
}: MascotCustomizationProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selected, setSelected] = useState<string>(currentOutfit);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) { setSelected(currentOutfit); setError(''); }
    }, [open, currentOutfit]);

    const item = OUTFITS.find((o) => o.id === selected) || OUTFITS[0];
    const unlocked = item.cost === 0 || unlockedOutfits.includes(item.id);
    const equipped = currentOutfit === item.id || (item.id === 'naked' && !OUTFITS.some((o) => o.id === currentOutfit));
    const name = (t(item.translationKey as any, language) || item.id).trim();

    const act = () => {
        if (equipped) return;
        if (unlocked) {
            onSave(item.id);
            soundManager.playSuccess();
            onClose();
            return;
        }
        if (gems < item.cost) {
            soundManager.playError();
            setError(t('insufficient_balance', language) || 'Gemas insuficientes');
            return;
        }
        if (onPurchase?.(item.id, item.cost)) {
            onSave(item.id);
            soundManager.playSuccess();
        } else {
            soundManager.playError();
        }
    };

    const label = equipped
        ? t('equipped', language)
        : unlocked
            ? t('equip_outfit', language)
            : `${t('buy_for', language)} ${item.cost}`;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={isMobile}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { bgcolor: cv.paper, borderRadius: isMobile ? 0 : '24px', overflow: 'hidden', color: cv.text, textAlign: 'left' } }}
        >
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('customize_mascot', language)}</Typography>
                    <Typography sx={{ fontSize: 13, color: cv.muted }}>Escolhe um acessório para o {MASCOT_NAME}.</Typography>
                </Box>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, height: 32, px: 1.5, borderRadius: 999, boxShadow: `inset 0 0 0 1px ${cv.border}`, fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                    <Diamond sx={{ fontSize: 16, color: cv.accent }} /> {gems}
                </Box>
                <IconButton onClick={onClose} aria-label="Fechar" sx={{ width: 36, height: 36 }}><Close sx={{ fontSize: 20 }} /></IconButton>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '300px 1fr' }, borderTop: `1px solid ${cv.border}`, minHeight: { sm: 460 }, flex: 1, overflow: 'hidden' }}>
                {/* Preview */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3, borderRight: { sm: `1px solid ${cv.border}` }, borderBottom: { xs: `1px solid ${cv.border}`, sm: 0 } }}>
                    <Box sx={{ width: { xs: 150, sm: 190 }, height: { xs: 150, sm: 190 }, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `color-mix(in srgb, ${item.color} 22%, transparent)`, transition: 'background-color .25s' }}>
                        <Mascot key={item.id} size={isMobile ? 120 : 150} mood={equipped ? 'happy' : 'idle'} outfit={item.id} />
                    </Box>
                    <Typography sx={{ fontFamily: cv.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', mt: 1.5 }}>{name}</Typography>
                    <Typography sx={{ fontSize: 13, color: error ? cv.coral : cv.muted, minHeight: 20 }}>
                        {error || (equipped ? 'A usar agora' : unlocked ? 'Já é teu' : `${item.cost} gemas`)}
                    </Typography>
                    <Box
                        component="button"
                        onClick={act}
                        disabled={equipped}
                        sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: 44, minWidth: 180, px: 3, border: 0, borderRadius: 999, font: 'inherit', fontSize: 14, fontWeight: 500, cursor: equipped ? 'default' : 'pointer', bgcolor: equipped ? 'transparent' : '#fff', color: equipped ? cv.muted : '#0d0d0d', boxShadow: equipped ? `inset 0 0 0 1px ${cv.border}` : 'none', transition: 'background-color .15s', '&:hover:not(:disabled)': { bgcolor: '#e6e6e6' } }}
                    >
                        {equipped && <Check sx={{ fontSize: 18 }} />}
                        {!unlocked && <Diamond sx={{ fontSize: 16, color: cv.accentStrong }} />}
                        {label}
                    </Box>
                </Box>

                {/* Collection */}
                <Box sx={{ p: 2.5, overflowY: 'auto', maxHeight: { sm: '62vh' } }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: cv.muted, mb: 1.25 }}>{t('collection', language)}</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(116px, 1fr))', gap: 1.25 }}>
                        {OUTFITS.map((o) => {
                            const own = o.cost === 0 || unlockedOutfits.includes(o.id);
                            const active = selected === o.id;
                            const wearing = currentOutfit === o.id;
                            return (
                                <Box
                                    key={o.id}
                                    component="button"
                                    onClick={() => { setSelected(o.id); setError(''); soundManager.playClick(); }}
                                    aria-pressed={active}
                                    sx={{ position: 'relative', p: 0, border: 0, font: 'inherit', color: cv.text, cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', bgcolor: cv.surface, textAlign: 'left', boxShadow: active ? `inset 0 0 0 2px #fff` : `inset 0 0 0 1px ${cv.border}`, transition: 'box-shadow .15s, transform .15s', '&:hover': { transform: 'translateY(-1px)' } }}
                                >
                                    <Box sx={{ height: 92, display: 'grid', placeItems: 'center', bgcolor: o.color, m: '3px', borderRadius: '13px' }}>
                                        <Mascot size={70} outfit={o.id} animated={false} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5, px: 1.25, py: 1 }}>
                                        <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {(t(o.translationKey as any, language) || o.id).trim()}
                                        </Typography>
                                        {wearing ? (
                                            <Check sx={{ fontSize: 15, color: cv.green }} />
                                        ) : own ? null : (
                                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: 12, color: cv.muted, fontVariantNumeric: 'tabular-nums' }}>
                                                {gems >= o.cost ? <Diamond sx={{ fontSize: 12, color: cv.accent }} /> : <LockOutlined sx={{ fontSize: 12 }} />}{o.cost}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </Dialog>
    );
}
