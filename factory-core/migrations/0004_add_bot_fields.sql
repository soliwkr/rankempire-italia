-- Aggiunge campi per integrazione bot Telegram
ALTER TABLE projects ADD COLUMN created_via TEXT DEFAULT 'dashboard';
ALTER TABLE projects ADD COLUMN build_mode TEXT DEFAULT 'speculative';
ALTER TABLE projects ADD COLUMN source_photo_r2_key TEXT;
