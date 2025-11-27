import React from 'react';
import { Button } from '../../../ui';

export default function SaveBar({ saving, canSave, note }) {
  return (
    <div style={{position:'sticky', bottom:0, background:'rgba(255,255,255,0.7)', backdropFilter:'saturate(180%) blur(8px)', padding:'10px 0', borderTop:'1px solid #e2e8f0', display:'flex', gap:8, alignItems:'center'}}>
      <Button type="submit" variant="primary" disabled={saving || !canSave} loading={saving}>
        {saving ? 'يحفظ...' : 'حفظ التغييرات'}
      </Button>
      {note ? <span style={{fontSize:'.75rem', opacity:.8}}>{note}</span> : null}
    </div>
  );
}
