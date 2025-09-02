import bcrypt from 'bcryptjs';

const password = "Password123";

bcrypt.hash(password, 10, (err, hash) => {
  if(err) throw err;
  console.log("Hashed password:", hash);
});
