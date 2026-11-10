import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppButton, AppInput, AppText, IconButton, Screen } from '../../components/ui';
import { sectorColor } from '../../components/wheel/WheelSvg';
import { useWheelStore } from '../../stores/wheelStore';
import { useTheme } from '../../theme/ThemeProvider';
import { spacing } from '../../theme/tokens';
import { newId } from '../../utils/random';
import { wheelTemplates } from './templates';
import { WHEEL_MAX_OPTIONS, WHEEL_NAME_MAX, WHEEL_OPTION_MAX } from './types';
import { hasErrors, validateWheelDraft, type WheelDraft } from './validation';

function initialDraft(existing: WheelDraft | undefined, templateId: string | undefined): WheelDraft {
  if (existing) return { name: existing.name, options: existing.options.map((o) => ({ ...o })) };
  const template = wheelTemplates.find((t) => t.id === templateId);
  if (template) return { name: template.name, options: template.options.map((label) => ({ id: newId(), label })) };
  return { name: '', options: [{ id: newId(), label: '' }, { id: newId(), label: '' }] };
}

export function WheelEditorScreen() {
  const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const existing = useWheelStore((s) => s.wheels.find((w) => w.id === id));
  const { createWheel, updateWheel, duplicateWheel, deleteWheel } = useWheelStore.getState();
  const [draft, setDraft] = useState<WheelDraft>(() => initialDraft(existing, template));
  const [showErrors, setShowErrors] = useState(false);

  const errors = validateWheelDraft(draft);
  const visible = showErrors ? errors : { optionIds: [] as string[] };

  const setOption = (optionId: string, label: string) =>
    setDraft((d) => ({ ...d, options: d.options.map((o) => (o.id === optionId ? { ...o, label } : o)) }));
  const removeOption = (optionId: string) =>
    setDraft((d) => ({ ...d, options: d.options.filter((o) => o.id !== optionId) }));
  const addOption = () => setDraft((d) => ({ ...d, options: [...d.options, { id: newId(), label: '' }] }));

  const save = () => {
    if (hasErrors(errors)) {
      setShowErrors(true);
      return;
    }
    if (existing) {
      updateWheel(existing.id, draft);
      router.back();
    } else {
      const wheel = createWheel(draft);
      router.replace({ pathname: '/roleta/[id]', params: { id: wheel.id } });
    }
  };

  const duplicate = () => {
    if (!existing) return;
    const copy = duplicateWheel(existing.id);
    if (copy) router.replace({ pathname: '/roleta/editar', params: { id: copy.id } });
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Excluir roleta?', `"${existing.name}" será apagada deste aparelho.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteWheel(existing.id);
          router.dismissTo('/roleta');
        },
      },
    ]);
  };

  return (
    <Screen edges={['bottom']} contentStyle={{ gap: 16 }}>
      <Stack.Screen
        options={{
          title: existing ? 'Editar roleta' : 'Nova roleta',
          headerRight: existing ? () => <IconButton icon="copy" label="Duplicar roleta" plain onPress={duplicate} /> : undefined,
        }}
      />
      <AppInput
        label="Nome da roleta"
        value={draft.name}
        onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
        maxLength={WHEEL_NAME_MAX}
        placeholder="Ex.: Quem lava a louça"
        error={visible.name}
      />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="smallStrong">{draft.options.length} opções</AppText>
        {draft.options.map((option, i) => (
          <View key={option.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: sectorColor(i, draft.options.length),
                borderWidth: 1,
                borderColor: colors.textMuted,
              }}
            />
            <View style={{ flex: 1 }}>
              <AppInput
                compact
                value={option.label}
                onChangeText={(label) => setOption(option.id, label)}
                accessibilityLabel={`Opção ${i + 1}`}
                placeholder={`Opção ${i + 1}`}
                maxLength={WHEEL_OPTION_MAX + 8}
                error={visible.optionIds.includes(option.id) ? ' ' : undefined}
              />
            </View>
            <IconButton
              icon="trash"
              plain
              label={`Excluir ${option.label || `opção ${i + 1}`}`}
              disabled={draft.options.length <= 2}
              onPress={() => removeOption(option.id)}
            />
          </View>
        ))}
        {visible.options ? (
          <AppText variant="small" color="danger" accessibilityLiveRegion="polite">
            {visible.options}
          </AppText>
        ) : null}
        <AppButton
          label="Adicionar opção"
          variant="ghost"
          size="sm"
          fullWidth
          disabled={draft.options.length >= WHEEL_MAX_OPTIONS}
          onPress={addOption}
        />
      </View>
      <AppButton label="Salvar roleta" onPress={save} fullWidth />
      {existing ? <AppButton label="Excluir roleta" variant="danger" size="sm" onPress={confirmDelete} fullWidth /> : null}
    </Screen>
  );
}
