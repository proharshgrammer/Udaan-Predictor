const { predictCutoff, calculateChance } = require('./services/predictor');
const db = require('./db');

const testPrediction = async () => {
    try {
        console.log("Starting Prediction Test...");
        
        // Simulate Request Body
        const req = {
            body: {
                rank: 15000,
                category: 'OPEN',
                quota: 'AI',
                gender: 'Gender-Neutral',
                counselling_type: 'JoSAA', // Try 'JoSAA' explicitly
                exam_type: 'JEE Main'
            }
        };

        const { rank, category, quota, gender, counselling_type, exam_type } = req.body;
        console.log("Params:", req.body);

        let query = `
            SELECT 
                c.name as college_name, 
                c.state,
                c.type as college_type,
                b.name as branch_name, 
                b.code as branch_code,
                cty.name as counselling_name,
                ct.year,
                ct.round,
                ct.closing_rank
            FROM cutoffs ct
            JOIN colleges c ON ct.college_id = c.id
            JOIN branches b ON ct.branch_id = b.id
            JOIN counselling_types cty ON ct.counselling_type_id = cty.id
            WHERE ct.category = $1 
            AND ct.quota = $2 
            AND ct.gender = $3
        `;

        const params = [category, quota, gender];
        let paramIndex = 4;

        if (counselling_type && counselling_type !== 'Multi-Counselling' && counselling_type !== 'Multi') {
            query += ` AND LOWER(cty.name) = LOWER($${paramIndex})`;
            params.push(counselling_type);
            paramIndex++;
        }

        if (exam_type) {
            if (exam_type === 'JEE Advanced') {
                query += ` AND c.type = 'IIT'`; 
            } else if (exam_type === 'JEE Main') {
                query += ` AND c.type IN ('NIT', 'IIIT', 'GFTI')`;
            }
        }

        query += ` ORDER BY ct.college_id, ct.branch_id, ct.year ASC`;
        
        console.log("Executing Query...");
        const result = await db.query(query, params);
        console.log(`Rows Found: ${result.rows.length}`);

        if (result.rows.length === 0) {
            console.log("No rows found. Check if data exists for these filters.");
             // Debug: check available categories/quotas/genders
             const meta = await db.query('SELECT DISTINCT category, quota, gender FROM cutoffs LIMIT 20');
             console.log("Available Metadata in DB:", meta.rows);
        } else {
             console.log("First Row:", result.rows[0]);
        }

    } catch (err) {
        console.error("Test Error:", err);
    } finally {
        process.exit();
    }
};

testPrediction();
