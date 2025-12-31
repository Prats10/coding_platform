const bcrypt = require('bcrypt');

const password = 'password123';
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Hashed password:', hash);
    }
});