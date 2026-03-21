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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id TEXT PRIMARY KEY,
      name TEXT,
      provider TEXT,
      amount_per_year INTEGER,
      eligible_categories TEXT,
      eligible_states TEXT,
      eligible_courses TEXT,
      max_family_income INTEGER,
      gender TEXT,
      min_percentage INTEGER,
      disability_required INTEGER,
      is_active INTEGER DEFAULT 1,
      application_portal_url TEXT,
      deadline_month TEXT,
      description TEXT
    )
  `);

  const scholarships = [
    // Central Government
    {
      id: 'c1', name: 'Post Matric Scholarship Scheme for Minorities', provider: 'Central Govt', amount_per_year: 10000,
      eligible_categories: 'Minority', eligible_states: 'All India', eligible_courses: 'Any', max_family_income: 200000,
      gender: 'Any', min_percentage: 50, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'October', description: 'Scholarship for minority community students studying in class 11 to Ph.D.'
    },
    {
      id: 'c2', name: 'Pre Matric Scholarship Scheme for Minorities', provider: 'Central Govt', amount_per_year: 5000,
      eligible_categories: 'Minority', eligible_states: 'All India', eligible_courses: 'Any', max_family_income: 100000,
      gender: 'Any', min_percentage: 50, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'October', description: 'Scholarship for minority community students studying in class 1 to 10.'
    },
    {
      id: 'c3', name: 'Merit-cum-Means Scholarship for Professional and Technical Courses', provider: 'Central Govt', amount_per_year: 20000,
      eligible_categories: 'Minority', eligible_states: 'All India', eligible_courses: 'Engineering, Medical', max_family_income: 250000,
      gender: 'Any', min_percentage: 50, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'October', description: 'Scholarship for minority students pursuing professional or technical courses.'
    },
    {
      id: 'c4', name: 'AICTE Pragati Scholarship for Girls', provider: 'Central Govt', amount_per_year: 50000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Engineering', max_family_income: 800000,
      gender: 'Female', min_percentage: 0, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'December', description: 'Empowering women through technical education. For girls taking admission in AICTE approved institutions.'
    },
    {
      id: 'c5', name: 'AICTE Saksham Scholarship Scheme', provider: 'Central Govt', amount_per_year: 50000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Engineering', max_family_income: 800000,
      gender: 'Any', min_percentage: 0, disability_required: 1, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'December', description: 'For specially-abled students to pursue technical education.'
    },
    {
      id: 'c6', name: 'Prime Minister Scholarship Scheme (PMSS)', provider: 'Central Govt', amount_per_year: 36000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 60, disability_required: 0, application_portal_url: 'https://ksb.gov.in',
      deadline_month: 'November', description: 'For dependent wards of Ex-Servicemen / Ex-Coast Guard personnel.'
    },
    {
      id: 'c7', name: 'Ishan Uday Special Scholarship Scheme', provider: 'Central Govt', amount_per_year: 64800,
      eligible_categories: 'All', eligible_states: 'Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Sikkim', eligible_courses: 'Any Degree', max_family_income: 450000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'December', description: 'Special scholarship for students from the North Eastern Region.'
    },
    {
      id: 'c8', name: 'Central Sector Scheme of Scholarships', provider: 'Central Govt', amount_per_year: 12000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: 450000,
      gender: 'Any', min_percentage: 80, disability_required: 0, application_portal_url: 'https://scholarships.gov.in',
      deadline_month: 'October', description: 'For college and university students who are above 80th percentile of successful candidates.'
    },

    // State Government (Maharashtra Focus)
    {
      id: 's1', name: 'Rajarshi Chhatrapati Shahu Maharaj Shikshan Shulkh Shishyavrutti Yojna', provider: 'State Govt', amount_per_year: 50000,
      eligible_categories: 'EBC, General', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 800000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Tuition fee waiver for Economically Backward Class students in Maharashtra.'
    },
    {
      id: 's2', name: 'Post Matric Scholarship for OBC Students', provider: 'State Govt', amount_per_year: 15000,
      eligible_categories: 'OBC', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 150000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Financial assistance to OBC students for post-matriculation studies.'
    },
    {
      id: 's3', name: 'Government of India Post-Matric Scholarship for SC Students', provider: 'State Govt', amount_per_year: 25000,
      eligible_categories: 'SC', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 250000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Scholarship for SC students to complete their education.'
    },
    {
      id: 's4', name: 'Post Matric Scholarship Scheme for ST', provider: 'State Govt', amount_per_year: 25000,
      eligible_categories: 'ST', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 250000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Financial support for ST students pursuing higher education.'
    },
    {
      id: 's5', name: 'Swadhar Gruh Scheme', provider: 'State Govt', amount_per_year: 51000,
      eligible_categories: 'SC', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 250000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Accommodation and financial assistance for SC students.'
    },
    {
      id: 's6', name: 'Post Matric Scholarship to VJNT Students', provider: 'State Govt', amount_per_year: 15000,
      eligible_categories: 'VJNT', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 150000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Scholarship for Vimukta Jati and Nomadic Tribes students.'
    },
    {
      id: 's7', name: 'Post Matric Scholarship to SBC Students', provider: 'State Govt', amount_per_year: 15000,
      eligible_categories: 'SBC', eligible_states: 'Maharashtra', eligible_courses: 'Any Degree', max_family_income: 150000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://mahadbt.maharashtra.gov.in',
      deadline_month: 'February', description: 'Scholarship for Special Backward Class students.'
    },

    // Private / Corporate
    {
      id: 'p1', name: 'Tata Capital Pankh Scholarship', provider: 'Private', amount_per_year: 12000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: 400000,
      gender: 'Any', min_percentage: 60, disability_required: 0, application_portal_url: 'https://www.buddy4study.com',
      deadline_month: 'November', description: 'Supports higher education of students belonging to economically weaker sections.'
    },
    {
      id: 'p2', name: 'Reliance Foundation Scholarships', provider: 'Private', amount_per_year: 200000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: 1500000,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://scholarships.reliancefoundation.org',
      deadline_month: 'February', description: 'Merit-cum-means scholarship for undergraduate students.'
    },
    {
      id: 'p3', name: 'L\'Oréal India For Young Women in Science', provider: 'Private', amount_per_year: 250000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Engineering, Medical, Science', max_family_income: 600000,
      gender: 'Female', min_percentage: 85, disability_required: 0, application_portal_url: 'https://www.buddy4study.com',
      deadline_month: 'October', description: 'Encourages young women to pursue higher education in science.'
    },
    {
      id: 'p4', name: 'Sitaram Jindal Foundation Scholarship', provider: 'Private', amount_per_year: 24000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: 250000,
      gender: 'Any', min_percentage: 60, disability_required: 0, application_portal_url: 'https://www.sitaramjindalfoundation.org',
      deadline_month: 'Anytime', description: 'Merit-cum-means scholarship for students across India.'
    },
    {
      id: 'p5', name: 'HDFC Educational Crisis Scholarship', provider: 'Private', amount_per_year: 25000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://www.hdfcbank.com',
      deadline_month: 'July', description: 'Support for students facing personal or economic crisis.'
    },
    {
      id: 'p6', name: 'Kotak Kanya Scholarship', provider: 'Private', amount_per_year: 150000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Engineering, Medical, Architecture', max_family_income: 600000,
      gender: 'Female', min_percentage: 85, disability_required: 0, application_portal_url: 'https://www.buddy4study.com',
      deadline_month: 'September', description: 'Financial assistance to meritorious girl students for professional graduation courses.'
    },
    {
      id: 'p7', name: 'Vigyan Jyoti Scholarship (DST)', provider: 'Private', amount_per_year: 12000,
      eligible_categories: 'All', eligible_states: 'All India', eligible_courses: 'Engineering, Science', max_family_income: null,
      gender: 'Female', min_percentage: 0, disability_required: 0, application_portal_url: 'https://dst.gov.in',
      deadline_month: 'August', description: 'Encouraging girls to pursue higher education and careers in STEM.'
    },
    // Asia (outside India)
    {
      id: 'w1', name: 'MEXT Scholarship', provider: 'Japanese Govt', amount_per_year: 1200000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 65, disability_required: 0, application_portal_url: 'https://www.studyinjapan.go.jp',
      deadline_month: 'May', description: 'Fully funded scholarship for international students to study in Japan.'
    },
    {
      id: 'w2', name: 'Global Korea Scholarship (GKS)', provider: 'Korean Govt', amount_per_year: 1000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 80, disability_required: 0, application_portal_url: 'https://www.studyinkorea.go.kr',
      deadline_month: 'March', description: 'Fully funded scholarship by the Korean government for international students.'
    },
    // Europe
    {
      id: 'w3', name: 'Erasmus Mundus Joint Masters', provider: 'European Union', amount_per_year: 2000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters', max_family_income: null,
      gender: 'Any', min_percentage: 70, disability_required: 0, application_portal_url: 'https://erasmus-plus.ec.europa.eu',
      deadline_month: 'January', description: 'Prestigious, integrated, international study programmes, jointly delivered by an international consortium of higher education institutions.'
    },
    {
      id: 'w4', name: 'DAAD Scholarships', provider: 'German Govt', amount_per_year: 1000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters, PhD', max_family_income: null,
      gender: 'Any', min_percentage: 70, disability_required: 0, application_portal_url: 'https://www.daad.de',
      deadline_month: 'October', description: 'Scholarships for international students to study in Germany.'
    },
    {
      id: 'w5', name: 'Eiffel Excellence Scholarship', provider: 'French Govt', amount_per_year: 1500000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters, PhD', max_family_income: null,
      gender: 'Any', min_percentage: 75, disability_required: 0, application_portal_url: 'https://www.campusfrance.org',
      deadline_month: 'January', description: 'Developed by the Ministry for Europe and Foreign Affairs to allow French higher education institutions to attract top foreign students.'
    },
    {
      id: 'w6', name: 'Chevening Scholarship', provider: 'UK Govt', amount_per_year: 2500000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters', max_family_income: null,
      gender: 'Any', min_percentage: 60, disability_required: 0, application_portal_url: 'https://www.chevening.org',
      deadline_month: 'November', description: 'The UK government’s global scholarship programme, funded by the Foreign, Commonwealth and Development Office.'
    },
    {
      id: 'w7', name: 'Swiss Government Excellence Scholarships', provider: 'Swiss Govt', amount_per_year: 2000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'PhD, Postdoc', max_family_income: null,
      gender: 'Any', min_percentage: 75, disability_required: 0, application_portal_url: 'https://www.sbfi.admin.ch',
      deadline_month: 'November', description: 'Promotes international exchange and research cooperation between Switzerland and over 180 other countries.'
    },
    // North America
    {
      id: 'w8', name: 'Fulbright Foreign Student Program', provider: 'US Govt', amount_per_year: 3000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters, PhD', max_family_income: null,
      gender: 'Any', min_percentage: 70, disability_required: 0, application_portal_url: 'https://foreign.fulbrightonline.org',
      deadline_month: 'October', description: 'Enables graduate students, young professionals and artists from abroad to study and conduct research in the United States.'
    },
    {
      id: 'w9', name: 'Banting Postdoctoral Fellowships', provider: 'Canadian Govt', amount_per_year: 4000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Postdoc', max_family_income: null,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://banting.fellowships-bourses.gc.ca',
      deadline_month: 'September', description: 'Provides funding to the very best postdoctoral applicants, both nationally and internationally.'
    },
    {
      id: 'w10', name: 'Vanier Canada Graduate Scholarships', provider: 'Canadian Govt', amount_per_year: 3000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'PhD', max_family_income: null,
      gender: 'Any', min_percentage: 80, disability_required: 0, application_portal_url: 'https://vanier.gc.ca',
      deadline_month: 'November', description: 'Attracts and retains world-class doctoral students and helps establish Canada as a global centre of excellence in research and higher learning.'
    },
    // Oceania
    {
      id: 'w11', name: 'Australia Awards Scholarships', provider: 'Australian Govt', amount_per_year: 2500000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 65, disability_required: 0, application_portal_url: 'https://www.dfat.gov.au',
      deadline_month: 'April', description: 'Long-term awards administered by the Department of Foreign Affairs and Trade.'
    },
    {
      id: 'w12', name: 'New Zealand International Scholarships', provider: 'New Zealand Govt', amount_per_year: 2000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Any Degree', max_family_income: null,
      gender: 'Any', min_percentage: 65, disability_required: 0, application_portal_url: 'https://www.nzscholarships.govt.nz',
      deadline_month: 'February', description: 'Fully funded scholarships for international students from eligible countries to study in New Zealand.'
    },
    // Global / Multiple Regions
    {
      id: 'w13', name: 'Rotary Foundation Global Scholarship Grants', provider: 'Rotary Foundation', amount_per_year: 2500000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters, PhD', max_family_income: null,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://www.rotary.org',
      deadline_month: 'Rolling', description: 'Funds graduate-level coursework or research for one to four academic years.'
    },
    {
      id: 'w14', name: 'Joint Japan World Bank Graduate Scholarship Program', provider: 'World Bank', amount_per_year: 2000000,
      eligible_categories: 'All', eligible_states: 'Global', eligible_courses: 'Masters', max_family_income: null,
      gender: 'Any', min_percentage: 0, disability_required: 0, application_portal_url: 'https://www.worldbank.org',
      deadline_month: 'May', description: 'Scholarships to students from developing countries to pursue master\'s degrees at participating universities around the world.'
    }
  ];

  let count = 0;
  for (const s of scholarships) {
    try {
      await pool.query(`
        INSERT INTO scholarships (
          id, name, provider, amount_per_year, eligible_categories, eligible_states, 
          eligible_courses, max_family_income, gender, min_percentage, disability_required, 
          is_active, application_portal_url, deadline_month, description
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) ON CONFLICT (id) DO NOTHING
      `, [
        s.id, s.name, s.provider, s.amount_per_year, s.eligible_categories, s.eligible_states,
        s.eligible_courses, s.max_family_income, s.gender, s.min_percentage, s.disability_required,
        1, s.application_portal_url, s.deadline_month, s.description
      ]);
      console.log(`Inserted: ${s.name}`);
      count++;
    } catch (e) {
      console.error(`Failed to insert ${s.name}:`, e.message);
    }
  }

  console.log(`\nFinished seeding. Inserted ${count} new scholarships.`);
  await pool.end();
}

run();
