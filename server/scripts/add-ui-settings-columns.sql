-- Safe SQL procedure to add ui_* columns to StoreSetting if they are missing.
-- Run this on your MySQL database (e.g., using mysql client, phpMyAdmin, or a DB GUI).

DELIMITER $$
DROP PROCEDURE IF EXISTS add_ui_settings_columns$$
CREATE PROCEDURE add_ui_settings_columns()
BEGIN
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_button_radius') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_button_radius VARCHAR(64) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_button_shadow') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_button_shadow TEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_input_radius') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_input_radius VARCHAR(64) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_font_family') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_font_family VARCHAR(191) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_base_font_size') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_base_font_size VARCHAR(32) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_sidebar_hover_preview') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_sidebar_hover_preview TINYINT(1) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_sidebar_collapsed_default') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_sidebar_collapsed_default TINYINT(1) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_spacing_scale') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_spacing_scale VARCHAR(32) NULL;
  END IF;
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='StoreSetting' AND COLUMN_NAME='ui_theme_default') THEN
    ALTER TABLE StoreSetting ADD COLUMN ui_theme_default VARCHAR(32) NULL;
  END IF;
END$$
CALL add_ui_settings_columns()$$
DROP PROCEDURE IF EXISTS add_ui_settings_columns$$
DELIMITER ;

-- After running this script, restart the API server so the new columns are available to Prisma/raw SQL paths.
