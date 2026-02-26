-- Set rhys.nunoo@myedspace.co.uk as admin
UPDATE profiles
SET role = 'admin', updated_at = now()
WHERE email = 'rhys.nunoo@myedspace.co.uk';
