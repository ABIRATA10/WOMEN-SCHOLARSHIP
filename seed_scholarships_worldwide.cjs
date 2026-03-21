const Database = require('better-sqlite3');
require('dotenv').config();

const db = new Database('database.sqlite');
const pool = {
  query: async (sql, params = []) => {
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');
    const safeParams = params.map(p => p === undefined ? null : p);
    try {
      if (isSelect) {
        const rows = db.prepare(sqliteSql).all(...safeParams);
        return { rows };
      } else {
        const info = db.prepare(sqliteSql).run(...safeParams);
        return { rows: [], rowCount: info.changes };
      }
    } catch (error) {
      console.error('SQL Error:', error);
      throw error;
    }
  },
  end: async () => {
    db.close();
  }
};

async function run() {
  console.log('Adding new columns to scholarships table...');

  try {
    await pool.query(`ALTER TABLE scholarships ADD COLUMN country TEXT DEFAULT 'India'`);
  } catch (e) {
    // Column might already exist
  }

  try {
    await pool.query(`ALTER TABLE scholarships ADD COLUMN region TEXT DEFAULT 'Asia'`);
  } catch (e) {
    // Column might already exist
  }

  try {
    await pool.query(`ALTER TABLE scholarships ADD COLUMN fully_funded INTEGER DEFAULT 0`);
  } catch (e) {
    // Column might already exist
  }

  const scholarships = [
    // Asia
    {
      id: 'mext-japan', name: 'MEXT Scholarship', provider: 'Government of Japan', country: 'Japan', region: 'Asia',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.studyinjapan.go.jp/', deadline_month: 'May',
      description: 'Fully funded scholarship by the Japanese government for international students to study in Japan.'
    },
    {
      id: 'kgsp-korea', name: 'Korean Government Scholarship Program (KGSP)', provider: 'NIIED', country: 'South Korea', region: 'Asia',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.studyinkorea.go.kr/', deadline_month: 'March',
      description: 'Provides international students with opportunities to conduct advanced studies in undergraduate & graduate programs at higher educational institutions in the Republic of Korea.'
    },
    {
      id: 'csc-china', name: 'Chinese Government Scholarship (CSC)', provider: 'China Scholarship Council', country: 'China', region: 'Asia',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.campuschina.org/', deadline_month: 'April',
      description: 'Fully funded scholarship for international students to study in Chinese universities.'
    },
    {
      id: 'singa-sg', name: 'Singapore International Graduate Award (SINGA)', provider: 'A*STAR', country: 'Singapore', region: 'Asia',
      amount_per_year: 24000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa', deadline_month: 'June',
      description: 'Award given to international students with excellent academic undergraduate and/or master\'s results, and strong interest in doing research leading to a doctorate (PhD) in Science and Engineering at a Singapore University.'
    },
    // Europe
    {
      id: 'erasmus-eu', name: 'Erasmus Mundus Joint Masters', provider: 'European Union', country: 'Multiple', region: 'Europe',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://erasmus-plus.ec.europa.eu/', deadline_month: 'January',
      description: 'Prestigious, integrated, international study programmes, jointly delivered by an international consortium of higher education institutions.'
    },
    {
      id: 'daad-germany', name: 'DAAD Scholarships', provider: 'DAAD', country: 'Germany', region: 'Europe',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.daad.de/', deadline_month: 'October',
      description: 'Scholarships for international students to study in Germany, focusing on development-related postgraduate courses.'
    },
    {
      id: 'chevening-uk', name: 'Chevening Scholarships', provider: 'UK Government', country: 'UK', region: 'Europe',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.chevening.org/', deadline_month: 'November',
      description: 'The UK government’s global scholarship programme, funded by the Foreign, Commonwealth and Development Office (FCDO) and partner organisations.'
    },
    // North America
    {
      id: 'fulbright-usa', name: 'Fulbright Foreign Student Program', provider: 'US Department of State', country: 'USA', region: 'North America',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://foreign.fulbrightonline.org/', deadline_month: 'October',
      description: 'Enables graduate students, young professionals and artists from abroad to study and conduct research in the United States.'
    },
    {
      id: 'vanier-canada', name: 'Vanier Canada Graduate Scholarships', provider: 'Government of Canada', country: 'Canada', region: 'North America',
      amount_per_year: 37000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://vanier.gc.ca/', deadline_month: 'November',
      description: 'Helps Canadian institutions attract highly qualified doctoral students.'
    },
    // Global
    {
      id: 'rhodes-global', name: 'Rhodes Scholarship', provider: 'Rhodes Trust', country: 'UK', region: 'Global',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.rhodeshouse.ox.ac.uk/', deadline_month: 'August',
      description: 'The oldest and perhaps most prestigious international scholarship programme, enabling outstanding young people from around the world to study at the University of Oxford.'
    },
    {
      id: 'aauw-global', name: 'AAUW International Fellowships', provider: 'AAUW', country: 'USA', region: 'Global',
      amount_per_year: 20000, fully_funded: 0, eligible_categories: 'Women', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Female', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.aauw.org/', deadline_month: 'November',
      description: 'Awarded for full-time study or research in the United States to women who are not U.S. citizens or permanent residents.'
    }
  ];

  console.log('Inserting scholarships...');
  let count = 0;
  for (const s of scholarships) {
    try {
      await pool.query(`
        INSERT INTO scholarships (
          id, name, provider, country, region, amount_per_year, fully_funded, 
          eligible_categories, eligible_states, eligible_courses, max_family_income, 
          gender, min_percentage, disability_required, is_active, application_portal_url, 
          deadline_month, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) ON CONFLICT (id) DO NOTHING
      `, [
        s.id, s.name, s.provider, s.country, s.region, s.amount_per_year, s.fully_funded,
        s.eligible_categories, s.eligible_states, s.eligible_courses, s.max_family_income,
        s.gender, s.min_percentage, s.disability_required, s.is_active, s.application_portal_url,
        s.deadline_month, s.description
      ]);
      console.log(`Inserted: ${s.name}`);
      count++;
    } catch (e) {
      console.error(`Failed to insert ${s.name}:`, e.message);
    }
  }

  console.log(`\nFinished seeding. Inserted ${count} scholarships.`);
  await pool.end();
}

run();
