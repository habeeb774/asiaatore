import React, { useState } from 'react';
import { Modal, View, TextInput, Image, ScrollView } from 'react-native';
import { Button, Text } from './UI';
import { useToast } from '../context/ToastContext';
import { loadImagePicker } from '../utils/loadImagePicker.js';

type CompletePayload = { note: string; proofUri?: string | null };

type CompleteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CompletePayload) => Promise<void> | void;
};

type FailModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
};

const modalContainerStyle = {
  flex: 1,
  justifyContent: 'flex-end' as const,
  backgroundColor: 'rgba(0,0,0,0.35)',
};

const sheetStyle = {
  backgroundColor: '#fff',
  paddingHorizontal: 20,
  paddingTop: 18,
  paddingBottom: 24,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  gap: 12,
  maxHeight: '80%' as const,
};

export function CompleteModal({ visible, onClose, onSubmit }: CompleteModalProps) {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickProof = async () => {
    try {
      const ImagePicker = await loadImagePicker();
      if (!ImagePicker) {
        toast.show({ type: 'warn', title: 'ميزة غير متاحة', description: 'اختيار الصور غير متاح في هذه البيئة.' });
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.show({ type: 'warn', title: 'الصور مرفوضة', description: 'يجب السماح بالوصول للصور لإرفاق إثبات التسليم.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
      if (!result.canceled && result.assets?.length) {
        setProofUri(result.assets[0].uri);
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'تعذر اختيار الصورة', description: err instanceof Error ? err.message : undefined });
    }
  };

  const takePhoto = async () => {
    try {
      const ImagePicker = await loadImagePicker();
      if (!ImagePicker) {
        toast.show({ type: 'warn', title: 'ميزة غير متاحة', description: 'الكاميرا غير متاحة في هذه البيئة.' });
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.show({ type: 'warn', title: 'الوصول للكاميرا مرفوض', description: 'فعّل صلاحية الكاميرا لالتقاط صورة الإثبات.' });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (!result.canceled && result.assets?.length) {
        setProofUri(result.assets[0].uri);
      }
    } catch (err) {
      toast.show({ type: 'error', title: 'تعذر فتح الكاميرا', description: err instanceof Error ? err.message : undefined });
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ note: note.trim(), proofUri });
      setNote('');
      setProofUri(null);
      onClose();
    } catch (err) {
      toast.show({ type: 'error', title: 'فشل الإرسال', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalContainerStyle}>
        <View style={sheetStyle}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>إنهاء الطلب</Text>
          <Text muted>أرفق ملاحظة للعميل أو الإدارة، ويمكن إضافة صورة كإثبات تسليم.</Text>
          <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={{ gap: 10 }}>
            <View style={{ gap: 6 }}>
              <Text muted>ملاحظة (اختياري)</Text>
              <TextInput
                multiline
                placeholder="مثال: تم التسليم للعميل شخصيًا"
                value={note}
                onChangeText={setNote}
                style={{ borderWidth: 1, borderColor: '#cbd5f5', borderRadius: 12, padding: 12, minHeight: 90, textAlignVertical: 'top' }}
              />
            </View>
            {proofUri ? (
              <View style={{ gap: 6 }}>
                <Text muted>صورة الإثبات</Text>
                <Image source={{ uri: proofUri }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
                <Button title="إزالة الصورة" variant="ghost" onPress={() => setProofUri(null)} />
              </View>
            ) : null}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button title="اختيار من المعرض" variant="secondary" onPress={pickProof} />
            <Button title="التقاط صورة" variant="ghost" onPress={takePhoto} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button title="إلغاء" variant="ghost" onPress={onClose} disabled={submitting} />
            <Button title={submitting ? 'جارٍ الإرسال...' : 'تسليم الطلب'} onPress={submit} disabled={submitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FailModal({ visible, onClose, onSubmit }: FailModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast.show({ type: 'warn', title: 'اذكر سبب عدم التسليم' });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      toast.show({ type: 'error', title: 'فشل الإرسال', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalContainerStyle}>
        <View style={sheetStyle}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>إبلاغ عن محاولة فاشلة</Text>
          <Text muted>وصف مختصر يساعد الدعم على معالجة الحالة.</Text>
          <TextInput
            multiline
            placeholder="مثال: العميل غير متواجد، رقم الهاتف مغلق"
            value={reason}
            onChangeText={setReason}
            style={{ borderWidth: 1, borderColor: '#cbd5f5', borderRadius: 12, padding: 12, minHeight: 120, textAlignVertical: 'top', marginTop: 12 }}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Button title="رجوع" variant="ghost" onPress={onClose} disabled={submitting} />
            <Button title={submitting ? 'جارٍ الإرسال...' : 'تأكيد الفشل'} variant="secondary" onPress={submit} disabled={submitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
