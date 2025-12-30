// services/codeforcesService.js - Complete Implementation

const axios = require('axios');

const CF_API = 'https://codeforces.com/api';
const RATE_LIMIT_DELAY = 600; // 600ms between requests (safe buffer)

let lastRequestTime = 0;

// ==================== RATE LIMITER ====================
async function rateLimitedRequest(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    // Wait if we're making requests too fast
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
        await sleep(waitTime);
    }
    
    lastRequestTime = Date.now();
    
    try {
        const response = await axios.get(url, {
            timeout: 10000 // 10 second timeout
        });
        return response;
    } catch (error) {
        if (error.response?.status === 503) {
            console.error('⚠️  Codeforces API is down or rate limited');
        }
        throw error;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== GET RANDOM PROBLEM ====================
async function getRandomProblem(minRating = 1000, maxRating = 1500) {
    try {
        console.log(`🔍 Fetching problems from Codeforces (${minRating}-${maxRating})...`);

        const response = await rateLimitedRequest(
            `${CF_API}/problemset.problems`
        );

        if (response.data.status !== 'OK') {
            throw new Error('Codeforces API returned error status');
        }

        const problems = response.data.result.problems;
        console.log(`📊 Total problems available: ${problems.length}`);

        // Filter problems by criteria
        const filtered = problems.filter(p => {
            return (
                p.rating >= minRating && 
                p.rating <= maxRating &&
                p.type === 'PROGRAMMING' &&
                p.index.length === 1 && // Only A, B, C, D, E, F
                !p.tags.includes('interactive') && // Skip interactive problems
                !p.tags.includes('*special') // Skip special problems
            );
        });

        console.log(`✅ Filtered to ${filtered.length} suitable problems`);

        if (filtered.length === 0) {
            throw new Error('No problems found in rating range');
        }

        // Pick random problem
        const problem = filtered[Math.floor(Math.random() * filtered.length)];

        console.log(`🎲 Selected: ${problem.contestId}${problem.index} - ${problem.name}`);
        console.log(`   Rating: ${problem.rating}, Tags: ${problem.tags.join(', ')}`);

        return {
            contestId: problem.contestId,
            index: problem.index,
            problemId: `${problem.contestId}${problem.index}`,
            name: problem.name,
            rating: problem.rating,
            tags: problem.tags,
            url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
        };

    } catch (error) {
        console.error('❌ Error fetching problem:', error.message);
        
        // Fallback to a known good problem if API fails
        console.log('⚠️  Using fallback problem...');
        return {
            contestId: 4,
            index: 'A',
            problemId: '4A',
            name: 'Watermelon',
            rating: 800,
            tags: ['math', 'brute force'],
            url: 'https://codeforces.com/problemset/problem/4/A'
        };
    }
}

// ==================== CHECK USER SUBMISSIONS ====================
async function checkUserSubmissions(cfHandle, problemId, afterTimestamp) {
    try {
        console.log(`🔎 Checking submissions for ${cfHandle} on problem ${problemId}...`);
        console.log(`   Looking for submissions after: ${new Date(afterTimestamp).toLocaleString()}`);

        const response = await rateLimitedRequest(
            `${CF_API}/user.status?handle=${cfHandle}&from=1&count=20`
        );

        if (response.data.status !== 'OK') {
            console.log(`⚠️  API error for ${cfHandle}: ${response.data.comment || 'Unknown error'}`);
            return null;
        }

        const submissions = response.data.result;
        console.log(`📝 Found ${submissions.length} recent submissions for ${cfHandle}`);

        // Find matching submissions
        for (const sub of submissions) {
            const subProblemId = `${sub.problem.contestId}${sub.problem.index}`;
            const subTime = sub.creationTimeSeconds * 1000; // Convert to milliseconds

            // Check if this submission matches our criteria
            if (subProblemId === problemId && subTime >= afterTimestamp) {
                console.log(`   Found submission ${sub.id}:`);
                console.log(`      Verdict: ${sub.verdict || 'TESTING'}`);
                console.log(`      Time: ${new Date(subTime).toLocaleString()}`);

                // Only return if verdict is OK (Accepted)
                if (sub.verdict === 'OK') {
                    console.log(`🎉 ACCEPTED SUBMISSION FOUND for ${cfHandle}!`);
                    
                    return {
                        submissionId: sub.id,
                        verdict: sub.verdict,
                        problemId: subProblemId,
                        timeMs: sub.timeConsumedMillis,
                        memoryBytes: sub.memoryConsumedBytes,
                        language: sub.programmingLanguage,
                        submittedAt: new Date(subTime)
                    };
                }
            }
        }

        console.log(`   No accepted submission found yet for ${cfHandle}`);
        return null;

    } catch (error) {
        if (error.response?.status === 400) {
            console.error(`❌ Invalid Codeforces handle: ${cfHandle}`);
        } else {
            console.error(`❌ Error checking ${cfHandle}:`, error.message);
        }
        return null;
    }
}

// ==================== VERIFY CF HANDLE ====================
async function verifyCFHandle(handle) {
    try {
        console.log(`🔍 Verifying Codeforces handle: ${handle}`);
        
        const response = await rateLimitedRequest(
            `${CF_API}/user.info?handles=${handle}`
        );
        
        if (response.data.status === 'OK') {
            console.log(`✅ Handle verified: ${handle}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Handle verification failed for ${handle}:`, error.message);
        return false;
    }
}

// ==================== TEST API CONNECTION ====================
async function testConnection() {
    try {
        console.log('🧪 Testing Codeforces API connection...');
        
        const response = await rateLimitedRequest(
            `${CF_API}/problemset.problems`
        );
        
        if (response.data.status === 'OK') {
            console.log('✅ Codeforces API is accessible!');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Cannot reach Codeforces API:', error.message);
        return false;
    }
}

module.exports = {
    getRandomProblem,
    checkUserSubmissions,
    verifyCFHandle,
    testConnection
};
