// Seed system roles

const API_URL = 'http://localhost:3000/api';

async function seed() {
  try {
    console.log('🌱 Seeding system roles...\n');
    const seedRes = await fetch(`${API_URL}/init/seed-roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminKey: 'clinic-crm-admin-2026'
      })
    });

    const seedData = await seedRes.json();
    
    if (!seedRes.ok) {
      console.error('❌ Seed failed:', seedData);
      return;
    }

    console.log('✓ Roles seeded!');
    console.log(`  Created: ${seedData.created.length}`);
    console.log(`  Existing: ${seedData.existing.length}`);
    console.log(`  Total: ${seedData.total}\n`);

    if (seedData.created.length > 0) {
      console.log('Created roles:');
      seedData.created.forEach(r => {
        console.log(`  - ${r.name} (${r.role_type})`);
      });
    }

    console.log('\n✅ System roles are now ready!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

seed();
