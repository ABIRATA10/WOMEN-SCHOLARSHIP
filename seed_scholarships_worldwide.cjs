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
    // Africa
    {
      id: 'mastercard-africa', name: 'Mastercard Foundation Scholars Program', provider: 'Mastercard Foundation', country: 'Multiple', region: 'Africa',
      amount_per_year: 15000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://mastercardfdn.org/all/scholars/', deadline_month: 'Varies',
      description: 'Develops Africa’s next generation of leaders by providing fully funded scholarships.'
    },
    {
      id: 'mandela-rhodes', name: 'Mandela Rhodes Scholarship', provider: 'Mandela Rhodes Foundation', country: 'South Africa', region: 'Africa',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.mandelarhodes.org/', deadline_month: 'April',
      description: 'Provides funding for a Honours or Masters degree in South Africa for young African leaders.'
    },
    {
      id: 'ruforum-africa', name: 'RUFORUM Scholarships', provider: 'RUFORUM', country: 'Multiple', region: 'Africa',
      amount_per_year: 8000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.ruforum.org/', deadline_month: 'March',
      description: 'Supports postgraduate training in agriculture and related sciences in Africa.'
    },
    {
      id: 'aau-africa', name: 'AAU Small Grants for Dissertations', provider: 'Association of African Universities', country: 'Multiple', region: 'Africa',
      amount_per_year: 3000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://aau.org/', deadline_month: 'Rolling',
      description: 'Grants to support PhD students in African universities to complete their dissertations.'
    },
    {
      id: 'ashinaga-africa', name: 'Ashinaga Africa Initiative', provider: 'Ashinaga', country: 'Multiple', region: 'Africa',
      amount_per_year: 20000, fully_funded: 1, eligible_categories: 'Orphans', eligible_states: 'All', eligible_courses: 'UG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://ashinaga.org/en/our-work/ashinaga-africa-initiative/', deadline_month: 'January',
      description: 'Provides higher education opportunities abroad for orphaned students from Sub-Saharan Africa.'
    },
    {
      id: 'kectil-africa', name: 'Kectil Program', provider: 'Knowles Educational and Charitable Trust', country: 'Multiple', region: 'Africa',
      amount_per_year: 0, fully_funded: 0, eligible_categories: 'Youth Leaders', eligible_states: 'All', eligible_courses: 'UG',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://kectil.com/', deadline_month: 'November',
      description: 'Web-based mentoring program for highly talented youth in developing countries.'
    },
    {
      id: 'womentech-africa', name: 'Women Techsters Fellowship', provider: 'Tech4Dev', country: 'Multiple', region: 'Africa',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'Women', eligible_states: 'All', eligible_courses: 'Tech Training',
      max_family_income: null, gender: 'Female', min_percentage: 60, disability_required: 0, is_active: 1,
      application_portal_url: 'https://tech4dev.com/', deadline_month: 'February',
      description: 'Empowers women across Africa with coding and deep tech skills.'
    },
    {
      id: 'agrf-africa', name: 'AGRF WAYA Awards', provider: 'AGRA', country: 'Multiple', region: 'Africa',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Women in Ag', eligible_states: 'All', eligible_courses: 'Entrepreneurship',
      max_family_income: null, gender: 'Female', min_percentage: 60, disability_required: 0, is_active: 1,
      application_portal_url: 'https://agra.org/', deadline_month: 'May',
      description: 'Recognizes female agripreneurs in Africa who have excelled in the agricultural value chain.'
    },
    {
      id: 'mo-ibrahim-africa', name: 'Mo Ibrahim Foundation Scholarships', provider: 'Mo Ibrahim Foundation', country: 'UK', region: 'Africa',
      amount_per_year: 30000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://mo.ibrahim.foundation/fellowships', deadline_month: 'March',
      description: 'Supports African students to pursue postgraduate degrees at partner institutions in the UK.'
    },
    {
      id: 'canon-collins-africa', name: 'Canon Collins Scholarships', provider: 'Canon Collins Trust', country: 'South Africa', region: 'Africa',
      amount_per_year: 5000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://canoncollins.org/', deadline_month: 'August',
      description: 'Scholarships for postgraduate study in South Africa for students from Southern Africa.'
    },
    // South America
    {
      id: 'oas-southamerica', name: 'OAS Academic Scholarships', provider: 'Organization of American States', country: 'Multiple', region: 'South America',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.oas.org/en/scholarships/', deadline_month: 'March',
      description: 'Scholarships for academic studies at undergraduate and graduate levels in OAS Member States.'
    },
    {
      id: 'boustany-latam', name: 'Boustany Foundation MBA Scholarship', provider: 'Boustany Foundation', country: 'UK/USA', region: 'South America',
      amount_per_year: 40000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'MBA',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://boustany-foundation.org/', deadline_month: 'May',
      description: 'MBA scholarships at Cambridge or Harvard, open to Latin American students.'
    },
    {
      id: 'fundacion-carolina', name: 'Fundación Carolina Scholarships', provider: 'Fundación Carolina', country: 'Spain', region: 'South America',
      amount_per_year: 15000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.fundacioncarolina.es/', deadline_month: 'March',
      description: 'Promotes cultural and educational relations between Spain and Latin America.'
    },
    {
      id: 'conacyt-mexico', name: 'CONACYT Scholarships', provider: 'CONACYT', country: 'Mexico', region: 'South America',
      amount_per_year: 8000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://conahcyt.mx/', deadline_month: 'Rolling',
      description: 'Scholarships for national and international students to pursue postgraduate studies in Mexico.'
    },
    {
      id: 'becas-chile', name: 'Becas Chile', provider: 'ANID', country: 'Chile', region: 'South America',
      amount_per_year: 20000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.anid.cl/', deadline_month: 'April',
      description: 'Scholarships for Chilean students to study abroad and international students to study in Chile.'
    },
    {
      id: 'fapesp-brazil', name: 'FAPESP Fellowships', provider: 'FAPESP', country: 'Brazil', region: 'South America',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD, Postdoc',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://fapesp.br/', deadline_month: 'Rolling',
      description: 'Research fellowships in the state of São Paulo, Brazil, open to international researchers.'
    },
    {
      id: 'pronabec-peru', name: 'Beca 18', provider: 'PRONABEC', country: 'Peru', region: 'South America',
      amount_per_year: 5000, fully_funded: 1, eligible_categories: 'Low Income', eligible_states: 'All', eligible_courses: 'UG',
      max_family_income: 15000, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.pronabec.gob.pe/', deadline_month: 'January',
      description: 'Comprehensive scholarship for high-performing Peruvian students in extreme poverty.'
    },
    {
      id: 'icetex-colombia', name: 'ICETEX Scholarships', provider: 'ICETEX', country: 'Colombia', region: 'South America',
      amount_per_year: 8000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://portal.icetex.gov.co/', deadline_month: 'Rolling',
      description: 'Educational credits and scholarships for Colombian students to study domestically or abroad.'
    },
    {
      id: 'senescyt-ecuador', name: 'Globo Común', provider: 'SENESCYT', country: 'Ecuador', region: 'South America',
      amount_per_year: 10000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://siau.senescyt.gob.ec/', deadline_month: 'Varies',
      description: 'Scholarships for Ecuadorian citizens to pursue higher education abroad.'
    },
    {
      id: 'mercosur-scholarships', name: 'MERCOSUR Educational Sector', provider: 'MERCOSUR', country: 'Multiple', region: 'South America',
      amount_per_year: 5000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://edu.mercosur.int/', deadline_month: 'Rolling',
      description: 'Promotes academic mobility and integration among MERCOSUR member countries.'
    },
    // Middle East
    {
      id: 'kaust-saudi', name: 'KAUST Fellowship', provider: 'King Abdullah University of Science and Technology', country: 'Saudi Arabia', region: 'Middle East',
      amount_per_year: 30000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://admissions.kaust.edu.sa/', deadline_month: 'January',
      description: 'Fully funded fellowship for graduate studies in science and technology at KAUST.'
    },
    {
      id: 'qatar-university', name: 'Qatar University Scholarships', provider: 'Qatar University', country: 'Qatar', region: 'Middle East',
      amount_per_year: 15000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.qu.edu.qa/students/admission/scholarships', deadline_month: 'March',
      description: 'Various scholarships for international and domestic students at Qatar University.'
    },
    {
      id: 'kuwait-government', name: 'Kuwait Government Scholarships', provider: 'Ministry of Higher Education Kuwait', country: 'Kuwait', region: 'Middle East',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.mohe.edu.kw/', deadline_month: 'June',
      description: 'Fully funded scholarships for international students to study in Kuwaiti universities.'
    },
    {
      id: 'uae-university', name: 'UAE University Scholarships', provider: 'United Arab Emirates University', country: 'UAE', region: 'Middle East',
      amount_per_year: 20000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.uaeu.ac.ae/', deadline_month: 'February',
      description: 'Full scholarships for international students pursuing graduate studies at UAEU.'
    },
    {
      id: 'israel-mfa', name: 'Israel MFA Scholarships', provider: 'Ministry of Foreign Affairs Israel', country: 'Israel', region: 'Middle East',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD, Postdoc',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://mfa.gov.il/', deadline_month: 'December',
      description: 'Scholarships for foreign students to study in Israel for summer ulpan or academic year.'
    },
    // Oceania
    {
      id: 'sydney-scholars', name: 'Sydney Scholars India Scholarship', provider: 'University of Sydney', country: 'Australia', region: 'Oceania',
      amount_per_year: 40000, fully_funded: 0, eligible_categories: 'Indian Citizens', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.sydney.edu.au/', deadline_month: 'April',
      description: 'Scholarship for Indian students commencing coursework degrees at the University of Sydney.'
    },
    {
      id: 'melbourne-research', name: 'Melbourne Research Scholarships', provider: 'University of Melbourne', country: 'Australia', region: 'Oceania',
      amount_per_year: 34000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://scholarships.unimelb.edu.au/', deadline_month: 'Rolling',
      description: 'Fully funded scholarships for domestic and international research students.'
    },
    {
      id: 'auckland-excellence', name: 'University of Auckland International Student Excellence Scholarship', provider: 'University of Auckland', country: 'New Zealand', region: 'Oceania',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.auckland.ac.nz/', deadline_month: 'November',
      description: 'Scholarship for new international students undertaking undergraduate or postgraduate study.'
    },
    {
      id: 'waikato-excellence', name: 'Vice Chancellor\'s International Excellence Scholarship', provider: 'University of Waikato', country: 'New Zealand', region: 'Oceania',
      amount_per_year: 15000, fully_funded: 0, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.waikato.ac.nz/', deadline_month: 'Rolling',
      description: 'Supports talented international students enrolling at the University of Waikato.'
    },
    {
      id: 'macquarie-india', name: 'Macquarie University India Scholarship', provider: 'Macquarie University', country: 'Australia', region: 'Oceania',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Indian Citizens', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.mq.edu.au/', deadline_month: 'Rolling',
      description: 'Scholarship for Indian students commencing studies at Macquarie University.'
    },
    // Europe (Additional)
    {
      id: 'eiffel-france', name: 'Eiffel Excellence Scholarship Program', provider: 'French Ministry for Europe and Foreign Affairs', country: 'France', region: 'Europe',
      amount_per_year: 14000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.campusfrance.org/', deadline_month: 'January',
      description: 'Attracts top foreign students to enroll in masters and PhD courses in France.'
    },
    {
      id: 'holland-scholarship', name: 'Holland Scholarship', provider: 'Nuffic', country: 'Netherlands', region: 'Europe',
      amount_per_year: 5000, fully_funded: 0, eligible_categories: 'Non-EEA', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.studyinholland.nl/', deadline_month: 'May',
      description: 'For international students from outside the EEA who want to do their bachelor’s or master’s in the Netherlands.'
    },
    {
      id: 'swedish-institute', name: 'Swedish Institute Scholarships for Global Professionals', provider: 'Swedish Institute', country: 'Sweden', region: 'Europe',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://si.se/', deadline_month: 'February',
      description: 'Fully funded master’s scholarships for global professionals to study in Sweden.'
    },
    {
      id: 'eth-zurich', name: 'ETH Zurich Excellence Scholarship', provider: 'ETH Zurich', country: 'Switzerland', region: 'Europe',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://ethz.ch/', deadline_month: 'December',
      description: 'Supports outstanding students wishing to pursue a Master’s degree at ETH Zurich.'
    },
    {
      id: 'bologna-italy', name: 'University of Bologna Study Grants', provider: 'University of Bologna', country: 'Italy', region: 'Europe',
      amount_per_year: 11000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.unibo.it/', deadline_month: 'March',
      description: 'Study grants for international students registering for degree programmes at the University of Bologna.'
    },
    // North America (Additional)
    {
      id: 'banting-postdoc', name: 'Banting Postdoctoral Fellowships', provider: 'Government of Canada', country: 'Canada', region: 'North America',
      amount_per_year: 70000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'Postdoc',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://banting.fellowships-bourses.gc.ca/', deadline_month: 'September',
      description: 'Provides funding to the very best postdoctoral applicants, both nationally and internationally.'
    },
    {
      id: 'trudeau-foundation', name: 'Pierre Elliott Trudeau Foundation Scholarships', provider: 'Trudeau Foundation', country: 'Canada', region: 'North America',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.trudeaufoundation.ca/', deadline_month: 'December',
      description: 'Three-year leadership program designed to train Engaged Leaders, equipping outstanding doctoral candidates.'
    },
    {
      id: 'knight-hennessy', name: 'Knight-Hennessy Scholars', provider: 'Stanford University', country: 'USA', region: 'North America',
      amount_per_year: 50000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://knight-hennessy.stanford.edu/', deadline_month: 'October',
      description: 'Fully funded fellowship for graduate study at Stanford University.'
    },
    {
      id: 'schwarzman-scholars', name: 'Schwarzman Scholars', provider: 'Tsinghua University', country: 'China', region: 'Asia',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.schwarzmanscholars.org/', deadline_month: 'September',
      description: 'Fully-funded master\'s program at Tsinghua University in Beijing, designed to build a global community of future leaders.'
    },
    {
      id: 'gates-cambridge', name: 'Gates Cambridge Scholarship', provider: 'Bill and Melinda Gates Foundation', country: 'UK', region: 'Europe',
      amount_per_year: 30000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.gatescambridge.org/', deadline_month: 'October',
      description: 'Full-cost scholarship for outstanding applicants from outside the UK to pursue a full-time postgraduate degree at Cambridge.'
    },
    // Diverse Fields
    {
      id: 'google-womentech', name: 'Google Women Techmakers Scholars Program', provider: 'Google', country: 'Global', region: 'Global',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Women', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Female', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.womentechmakers.com/scholars', deadline_month: 'December',
      description: 'Scholarship for women in computer science and technology.'
    },
    {
      id: 'adobe-research', name: 'Adobe Research Women-in-Technology Scholarship', provider: 'Adobe', country: 'Global', region: 'Global',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Women', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Female', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://research.adobe.com/scholarship/', deadline_month: 'November',
      description: 'Recognizes outstanding female undergraduate and master\'s students studying computer science.'
    },
    {
      id: 'amelia-earhart', name: 'Amelia Earhart Fellowship', provider: 'Zonta International', country: 'Global', region: 'Global',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Women', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Female', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.zonta.org/', deadline_month: 'November',
      description: 'Awarded to women pursuing Ph.D./doctoral degrees in aerospace engineering and space sciences.'
    },
    {
      id: 'ofid-scholarship', name: 'OFID Scholarship Award', provider: 'OPEC Fund for International Development', country: 'Global', region: 'Global',
      amount_per_year: 50000, fully_funded: 1, eligible_categories: 'Developing Countries', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://opecfund.org/', deadline_month: 'April',
      description: 'Sponsors outstanding young students from developing countries who wish to pursue a Master\'s degree in a development-related field.'
    },
    {
      id: 'joint-japan-wb', name: 'Joint Japan World Bank Graduate Scholarship', provider: 'World Bank', country: 'Multiple', region: 'Global',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'Developing Countries', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.worldbank.org/', deadline_month: 'May',
      description: 'Scholarships to students from developing countries to pursue master\'s degrees at participating universities.'
    },
    {
      id: 'wellcome-trust', name: 'Wellcome Trust International Master\'s Fellowships', provider: 'Wellcome Trust', country: 'UK', region: 'Global',
      amount_per_year: 35000, fully_funded: 1, eligible_categories: 'Low/Middle Income', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://wellcome.org/', deadline_month: 'April',
      description: 'Offers nationals of low- and middle-income countries the opportunity to receive training at Master\'s degree level.'
    },
    {
      id: 'owsd-phd', name: 'OWSD PhD Fellowships', provider: 'OWSD', country: 'Global South', region: 'Global',
      amount_per_year: 15000, fully_funded: 1, eligible_categories: 'Women in Science', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Female', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://owsd.net/', deadline_month: 'April',
      description: 'Fellowships for women scientists from Science and Technology Lagging Countries to pursue PhD research.'
    },
    {
      id: 'twb-scholarship', name: 'Translators without Borders Training', provider: 'TWB', country: 'Global', region: 'Global',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'Translators', eligible_states: 'All', eligible_courses: 'Training',
      max_family_income: null, gender: 'Any', min_percentage: 60, disability_required: 0, is_active: 1,
      application_portal_url: 'https://translatorswithoutborders.org/', deadline_month: 'Rolling',
      description: 'Free training and certification for translators in marginalized languages.'
    },
    {
      id: 'arts-council', name: 'Arts Council Grants', provider: 'Arts Council', country: 'Multiple', region: 'Global',
      amount_per_year: 10000, fully_funded: 0, eligible_categories: 'Artists', eligible_states: 'All', eligible_courses: 'Arts',
      max_family_income: null, gender: 'Any', min_percentage: 60, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.artscouncil.org.uk/', deadline_month: 'Rolling',
      description: 'Grants and fellowships for emerging and established artists globally.'
    },
    {
      id: 'green-brain', name: 'Green Brain of the Year', provider: 'METU NCC', country: 'Cyprus', region: 'Europe',
      amount_per_year: 5000, fully_funded: 0, eligible_categories: 'Sustainability', eligible_states: 'All', eligible_courses: 'UG',
      max_family_income: null, gender: 'Any', min_percentage: 70, disability_required: 0, is_active: 1,
      application_portal_url: 'https://greenbrain.ncc.metu.edu.tr/', deadline_month: 'June',
      description: 'International competition for high school and university students on sustainable environment.'
    },
    {
      id: 'un-fellowship', name: 'UN Regional Course in International Law', provider: 'United Nations', country: 'Multiple', region: 'Global',
      amount_per_year: 0, fully_funded: 1, eligible_categories: 'Lawyers', eligible_states: 'All', eligible_courses: 'Training',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://legal.un.org/poa/rcil/', deadline_month: 'Varies',
      description: 'Provides high-quality training by leading scholars and practitioners on international law.'
    },
    {
      id: 'rotary-peace', name: 'Rotary Peace Fellowships', provider: 'Rotary International', country: 'Multiple', region: 'Global',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'Peacebuilders', eligible_states: 'All', eligible_courses: 'PG, Certificate',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.rotary.org/en/our-programs/peace-fellowships', deadline_month: 'May',
      description: 'Fully funded academic fellowships at Rotary Peace Centers around the world.'
    },
    {
      id: 'eiffel-france-2', name: 'Eiffel Excellence Scholarship Program', provider: 'French Ministry for Europe and Foreign Affairs', country: 'France', region: 'Europe',
      amount_per_year: 14000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.campusfrance.org/', deadline_month: 'January',
      description: 'Attracts top foreign students to enroll in masters and PhD courses in France.'
    },
    {
      id: 'holland-scholarship-2', name: 'Holland Scholarship', provider: 'Nuffic', country: 'Netherlands', region: 'Europe',
      amount_per_year: 5000, fully_funded: 0, eligible_categories: 'Non-EEA', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.studyinholland.nl/', deadline_month: 'May',
      description: 'For international students from outside the EEA who want to do their bachelor’s or master’s in the Netherlands.'
    },
    {
      id: 'swedish-institute-2', name: 'Swedish Institute Scholarships for Global Professionals', provider: 'Swedish Institute', country: 'Sweden', region: 'Europe',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 80, disability_required: 0, is_active: 1,
      application_portal_url: 'https://si.se/', deadline_month: 'February',
      description: 'Fully funded master’s scholarships for global professionals to study in Sweden.'
    },
    {
      id: 'eth-zurich-2', name: 'ETH Zurich Excellence Scholarship', provider: 'ETH Zurich', country: 'Switzerland', region: 'Europe',
      amount_per_year: 12000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://ethz.ch/', deadline_month: 'December',
      description: 'Supports outstanding students wishing to pursue a Master’s degree at ETH Zurich.'
    },
    {
      id: 'bologna-italy-2', name: 'University of Bologna Study Grants', provider: 'University of Bologna', country: 'Italy', region: 'Europe',
      amount_per_year: 11000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'UG, PG',
      max_family_income: null, gender: 'Any', min_percentage: 75, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.unibo.it/', deadline_month: 'March',
      description: 'Study grants for international students registering for degree programmes at the University of Bologna.'
    },
    {
      id: 'banting-postdoc-2', name: 'Banting Postdoctoral Fellowships', provider: 'Government of Canada', country: 'Canada', region: 'North America',
      amount_per_year: 70000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'Postdoc',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://banting.fellowships-bourses.gc.ca/', deadline_month: 'September',
      description: 'Provides funding to the very best postdoctoral applicants, both nationally and internationally.'
    },
    {
      id: 'trudeau-foundation-2', name: 'Pierre Elliott Trudeau Foundation Scholarships', provider: 'Trudeau Foundation', country: 'Canada', region: 'North America',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PhD',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.trudeaufoundation.ca/', deadline_month: 'December',
      description: 'Three-year leadership program designed to train Engaged Leaders, equipping outstanding doctoral candidates.'
    },
    {
      id: 'knight-hennessy-2', name: 'Knight-Hennessy Scholars', provider: 'Stanford University', country: 'USA', region: 'North America',
      amount_per_year: 50000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://knight-hennessy.stanford.edu/', deadline_month: 'October',
      description: 'Fully funded fellowship for graduate study at Stanford University.'
    },
    {
      id: 'schwarzman-scholars-2', name: 'Schwarzman Scholars', provider: 'Tsinghua University', country: 'China', region: 'Asia',
      amount_per_year: 40000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG',
      max_family_income: null, gender: 'Any', min_percentage: 85, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.schwarzmanscholars.org/', deadline_month: 'September',
      description: 'Fully-funded master\'s program at Tsinghua University in Beijing, designed to build a global community of future leaders.'
    },
    {
      id: 'gates-cambridge-2', name: 'Gates Cambridge Scholarship', provider: 'Bill and Melinda Gates Foundation', country: 'UK', region: 'Europe',
      amount_per_year: 30000, fully_funded: 1, eligible_categories: 'All', eligible_states: 'All', eligible_courses: 'PG, PhD',
      max_family_income: null, gender: 'Any', min_percentage: 90, disability_required: 0, is_active: 1,
      application_portal_url: 'https://www.gatescambridge.org/', deadline_month: 'October',
      description: 'Full-cost scholarship for outstanding applicants from outside the UK to pursue a full-time postgraduate degree at Cambridge.'
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
