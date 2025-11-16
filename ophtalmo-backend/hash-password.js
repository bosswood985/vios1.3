const bcrypt = require('bcrypt');
const password = 'Admin@123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Password hash:', hash);
});