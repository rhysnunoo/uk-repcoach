-- Set Bitrix user ID for Jake Makking-Robinson
UPDATE profiles
SET bitrix_user_id = '281784', updated_at = now()
WHERE LOWER(email) = LOWER('jake.makking-robinson@myedspace.co.uk');
