const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
  console.log('\n🔐 Configuration du compte administrateur\n');
  
  try {
    // Check if admin exists
    const existingAdmin = await pool.query(
      "SELECT id, email FROM user_table WHERE email = 'admin@ophtalmo.com'"
    );
    
    let email, fullName;
    
    if (existingAdmin.rows.length > 0) {
      console.log('✓ Un compte admin existe déjà: admin@ophtalmo.com');
      const update = await question('Voulez-vous mettre à jour son mot de passe? (o/n): ');
      if (update.toLowerCase() !== 'o') {
        console.log('Annulé.');
        process.exit(0);
      }
      email = 'admin@ophtalmo.com';
    } else {
      console.log('Création d\'un nouveau compte administrateur\n');
      email = await question('Email (default: admin@ophtalmo.com): ') || 'admin@ophtalmo.com';
      fullName = await question('Nom complet (default: Administrateur): ') || 'Administrateur';
    }
    
    // Get password
    const password = await question('Mot de passe (min 6 caractères): ');
    
    if (password.length < 6) {
      console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
      process.exit(1);
    }
    
    const confirmPassword = await question('Confirmez le mot de passe: ');
    
    if (password !== confirmPassword) {
      console.log('❌ Les mots de passe ne correspondent pas');
      process.exit(1);
    }
    
    // Hash password
    console.log('\n⏳ Hachage du mot de passe...');
    const password_hash = await bcrypt.hash(password, 10);
    
    // Update or create admin
    if (existingAdmin.rows.length > 0) {
      await pool.query(
        'UPDATE user_table SET password_hash = $1, updated_date = NOW() WHERE email = $2',
        [password_hash, email]
      );
      console.log('\n✅ Mot de passe mis à jour avec succès!');
    } else {
      await pool.query(
        `INSERT INTO user_table (email, password_hash, full_name, specialite, role, is_active, created_date, updated_date)
         VALUES ($1, $2, $3, 'admin', 'admin', true, NOW(), NOW())`,
        [email, password_hash, fullName]
      );
      console.log('\n✅ Compte administrateur créé avec succès!');
    }
    
    console.log('\n📋 Informations de connexion:');
    console.log('   Email:', email);
    console.log('   Mot de passe: ********\n');
    console.log('Vous pouvez maintenant vous connecter à l\'application.\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

setupAdmin();