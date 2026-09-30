// Profile > Speech on This Phone: whether the offline speech pack is here,
// a button to download it, and a way to take back Don't Ask Again. The
// wording is in lib/voicePack.ts, the phone calls in lib/voicePackDevice.ts.
import { useCallback, useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { VOICE_PACK_CARD_LEAD, canDownloadVoicePack, languageName, voicePackStatusLine, type VoicePackSituation } from '../lib/voicePack';
import {
  currentSpeechServiceName,
  downloadVoicePack,
  getVoicePackNeverAsk,
  getVoicePackSituation,
  setVoicePackNeverAsk,
} from '../lib/voicePackDevice';

const LANG = 'en-US';

type Props = {
  textStyle: StyleProp<TextStyle>;
  buttonStyle: StyleProp<ViewStyle>;
  buttonTextStyle: StyleProp<TextStyle>;
};

export function VoicePackPanel({ textStyle, buttonStyle, buttonTextStyle }: Props) {
  const [situation, setSituation] = useState<VoicePackSituation | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [neverAsk, setNeverAsk] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, never] = await Promise.all([getVoicePackSituation(LANG), getVoicePackNeverAsk().catch(() => false)]);
    setSituation(s);
    setUnknown(s === null);
    setNeverAsk(never);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const service = currentSpeechServiceName();

  const onDownload = useCallback(async () => {
    setBusy(true);
    const status = await downloadVoicePack(LANG);
    setBusy(false);
    if (status === 'download_success') {
      Alert.alert('Speech Pack Downloaded', 'Every microphone in the app now turns speech into text on this phone.');
    } else if (status === 'download_scheduled') {
      Alert.alert(
        'The Speech Pack Is on Its Way',
        'The phone will finish the download when it can, usually once it is on Wi-Fi. After that, every microphone in the app uses it without asking.',
      );
    } else if (status === 'failed') {
      Alert.alert(
        'The Download Did Not Start',
        `The phone did not start the download. You can download ${languageName(LANG)} in the phone's speech recognition settings instead.`,
      );
    }
    void load();
  }, [load]);

  const onAskAgain = useCallback(async () => {
    await setVoicePackNeverAsk(false);
    setNeverAsk(false);
  }, []);

  if (!situation) {
    return (
      <>
        <Text style={textStyle}>{VOICE_PACK_CARD_LEAD}</Text>
        {unknown ? (
          <Text style={textStyle}>The phone did not say which speech packs it has, so this card cannot tell whether one is here.</Text>
        ) : null}
      </>
    );
  }
  const downloadable = canDownloadVoicePack(situation) && !situation.installed;

  return (
    <>
      <Text style={textStyle}>{VOICE_PACK_CARD_LEAD}</Text>
      <Text style={textStyle}>{voicePackStatusLine({ ...situation, neverAsk }, LANG, service)}</Text>
      {downloadable ? (
        <TouchableOpacity style={buttonStyle} onPress={() => void onDownload()} disabled={busy}>
          <Text style={buttonTextStyle}>{busy ? 'Starting the Download' : 'Download the Speech Pack'}</Text>
        </TouchableOpacity>
      ) : null}
      {downloadable && neverAsk ? (
        <TouchableOpacity style={buttonStyle} onPress={() => void onAskAgain()}>
          <Text style={buttonTextStyle}>Ask Me Again at the Microphone</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );
}
