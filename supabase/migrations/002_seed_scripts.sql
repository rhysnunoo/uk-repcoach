-- Seed Scripts for RepCoach (UK MyEdSpace)
-- CLOSER Framework sales scripts adapted for UK tutoring market
-- Based on official MyEdSpace UK sales methodology

-- Delete existing scripts to replace with UK versions
delete from scripts where course in ('Pre-Algebra', 'Algebra 1', 'Geometry', 'Algebra 2', 'KS3', 'GCSE', 'A-Level', 'Primary');

-- KS3 Script (Year 7-9: Maths, English, Science)
insert into scripts (name, course, version, is_active, content) values (
  'KS3 Sales Script v1',
  'KS3',
  1,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "10-15 minutes",
    "course_details": {
      "name": "KS3 (Year 7-9)",
      "year_groups": ["Year 7", "Year 8", "Year 9"],
      "subjects": ["Maths", "English", "Science"],
      "teachers": {
        "Maths": {"name": "Nick Featherstone / Neil Trivedi", "credentials": "15+ years teaching, Masters from Oxford / 9+ years, 1st Class from UCL"},
        "English": {"name": "Louis Provis / Eleanor St John Sutton", "credentials": "11+ years, MAs from Cambridge & Oxford / 6+ years, Double 1st from UPenn"},
        "Science": {"name": "Hannah Shuter, Emma Williams & team", "credentials": "40+ years combined experience"}
      },
      "schedule_note": "2 live lessons per week per subject, weekday evenings between 16:30-19:50"
    },
    "pricing": {
      "annual_1_subject": {"price": 319, "original": 480, "lessons": 74, "payment_plan": "3x £106.33", "framing": "£4.31 per lesson vs £50 for a tutor"},
      "annual_2_subjects": {"price": 574.20, "original": 864, "lessons": 148, "payment_plan": "3x £191.40"},
      "annual_ultimate": {"price": 789, "original": 1080, "lessons": 222, "payment_plan": "3x £263"},
      "monthly": {"1_subject": 80, "2_subjects": 144, "ultimate": 180, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 10, "duration": "10 days", "framing": "Full access, no auto-renewal"},
      "upfront_discount": "5% off if paid upfront",
      "sibling_discount": "20% off less expensive package"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation with me, really excited to help your child achieve their goals. Just to let you know, this call is recorded for training purposes. Is that okay? Brilliant. So just a quick background - we''ve helped over 21,000 students across the UK improve their grades and confidence. On this call, I''d love to understand what''s going on with your child that made you reach out, show you how we might be able to help, and see if it''s a good fit. Should only take about 10 minutes. How does that sound?",
        "required_elements": [
          "Greet + confirm speaking with right person",
          "Recording disclosure and consent",
          "Brief proof/credibility (21,000+ students across the UK)",
          "Promise outcome (understand situation, show how to help, see if good fit)",
          "Plan for the call (~10 minutes)",
          "Micro-commitment (How does that sound?)"
        ],
        "red_flags": [
          "How are you today? opener (conversion killer)",
          "Launching into product pitch immediately",
          "No agenda setting",
          "Long company introduction",
          "Forgetting recording disclosure"
        ],
        "scoring": {
          "5": "All required elements present, recording disclosed, gets micro-commitment, under 60 sec",
          "4": "Has most elements but missing one (e.g., no micro-commitment)",
          "3": "Has agenda but missing proof OR promise",
          "2": "Long company intro, no clear agenda",
          "1": "How are you today? opener, launches into pitch, no agenda"
        }
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "2-3 min",
        "goal": "Get child name, year group, subjects, and check siblings. Kill zombies.",
        "exact_script": [
          "So first things first - who''s the lucky one we''re helping today? What''s your child''s name?",
          "And do you have any other children who might benefit from some support too?",
          "Great. What year is [Child] in?",
          "Perfect. For [Year Group], we offer [Subjects]. Which of these - if not all - are you interested in for [Child]?",
          "Before I tell you more - other parents sometimes make the mistake of waiting until the end of the call and then having to get their partner to hear everything again. So just want to check: is it only you that needs to hear this, or should we get someone else involved upfront?"
        ],
        "required_elements": [
          "Get child''s name",
          "Check for siblings (20% discount opportunity)",
          "Confirm year group",
          "Identify subjects of interest",
          "Kill zombies - check if spouse/partner needs to be involved",
          "Handle child buy-in if mentioned"
        ],
        "red_flags": [
          "Assuming year group or subjects without asking",
          "Only yes/no questions",
          "Forgetting to check for siblings",
          "Not addressing decision-maker question",
          "Rep talks more than prospect"
        ],
        "scoring": {
          "5": "Gets name, year group, subjects, checks siblings, kills zombies, uses open-ended questions",
          "4": "Good discovery but misses one element (e.g., no zombie kill or sibling check)",
          "3": "Some discovery but relies on closed yes/no questions",
          "2": "Minimal discovery, moves quickly to pitch",
          "1": "Assumes details without asking, talks more than listens"
        }
      },
      "label": {
        "name": "L - Label",
        "duration": "1-2 min",
        "goal": "Name their problem back and get confirmation. Includes discovery questions.",
        "exact_script": [
          "So tell me, what''s been going on with [Child]''s education that made you reach out to us?",
          "[EMPATHY CHECK: Repeat their problem back, acknowledge it, associate: We hear this a lot from parents, you''re definitely not alone.]",
          "And what would success look like for [Child] by the end of this school year?",
          "What made you reach out now, versus a few months ago?",
          "Okay, so let me make sure I''ve got this right. [Child] is in [Year] taking [Subjects]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that right?"
        ],
        "required_elements": [
          "Ask what made them reach out (open-ended)",
          "Empathy check: repeat, acknowledge, associate",
          "Ask about success vision",
          "Uncover urgency trigger (why now?)",
          "Restate problem using THEIR words",
          "Include year group, subjects, challenge, and goal",
          "Get verbal confirmation"
        ],
        "red_flags": [
          "Skipping labeling entirely",
          "Moving to solution without confirmation",
          "Not using their words",
          "No empathy or acknowledgment",
          "Not waiting for confirmation"
        ],
        "scoring": {
          "5": "Full discovery, empathy check, restates using their words, includes all details, gets verbal confirmation",
          "4": "Good summary but missed empathy or confirmation was weak",
          "3": "Acknowledges but doesn''t get explicit confirmation",
          "2": "Parrots their words without synthesis",
          "1": "Skips labeling entirely, moves straight to pitch"
        }
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before reaching out to us, what have you tried so far to help [Child]?",
          "[Common: private tutors, YouTube, extra homework, school support, nothing yet]",
          "And how did that go?",
          "[Let them explain why it didn''t work. Don''t interrupt.]",
          "Okay. And what else have you tried?",
          "[Keep asking ''what else?'' until exhausted]",
          "So you''ve tried [list everything], and none of it has quite worked. How long has this been going on?",
          "And if things stay the way they are - what does that mean for [Child] by [exam time / end of the year]?"
        ],
        "active_listening_cues": [
          "That makes sense.",
          "I hear that a lot.",
          "That''s really common."
        ],
        "required_elements": [
          "Ask about ALL past attempts",
          "Follow up with ''How did that go?'' for EACH attempt",
          "Exhaust with ''What else?'' until nothing left",
          "Summarize and confirm all attempts failed",
          "Ask about duration",
          "Ask about consequences if nothing changes"
        ],
        "red_flags": [
          "Skipping pain cycle entirely (CRITICAL FAILURE)",
          "Not exploring past failures in depth",
          "Only asking once about past attempts",
          "Moving to pitch before exhausting pain",
          "No empathy or acknowledgment"
        ],
        "scoring": {
          "5": "Asks about past attempts, follows up with how did that go? for each, exhausts with what else? multiple times, summarizes, asks about duration, asks about consequences",
          "4": "Good pain cycle but didn''t fully exhaust or missed consequences",
          "3": "Asks about past attempts but doesn''t go deep, moves on after 1-2 attempts",
          "2": "Minimal exploration, token question about past attempts",
          "1": "Skips pain cycle entirely, goes straight to pitch (CRITICAL FAILURE)"
        }
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes, lead with teacher credentials, set expectations",
        "permission_script": "That''s really helpful, thank you. Can I tell you a bit about how we might be able to help?",
        "teacher_intro": "Let me tell you about who''ll be teaching [Child]... Our teachers are in the top 1% in the country - combined 100+ years of teaching experience. What students say makes them special is how they explain topics. They can take something confusing and just make it click.",
        "how_it_works": "[Child] gets 2 live lessons every week per subject. They follow along with a workbook we provide, so they can focus on listening instead of frantically copying notes. The teacher teaches live - it''s interactive, not passive. Students ask questions in chat, work through problems together. On average, each student sends around 25 messages per lesson - that level of engagement is incomparable to a normal classroom.",
        "practice_and_solutions": "And it doesn''t stop when the lesson ends. Every week, there are practice problems that reinforce what was taught. And here''s the key part - every single problem has a video solution where the teacher walks through it step by step. So if [Child] gets stuck at 9pm doing homework? They''re not actually stuck.",
        "recordings": "Every lesson is recorded and available instantly. So if [Child] misses a class - football practice, family dinner, whatever - they just watch the recording. They don''t fall behind.",
        "proof_points": {
          "engagement": "25 chat messages per student per lesson on average",
          "results_gcse": "58% of GCSE students achieved grades 7-9 - double the national average",
          "results_general": "Students perform 3x better than national averages",
          "satisfaction": "95% parent satisfaction, 1,700+ five-star Trustpilot reviews",
          "scale": "21,000+ students across the UK",
          "guarantee": "14-day money-back guarantee"
        },
        "required_elements": [
          "Lead with teacher credentials (top 1%, combined experience, specific teacher names if known)",
          "Bridge from their SPECIFIC pain point (not generic pitch)",
          "Explain what their week looks like (2 live lessons, workbooks, practice, video solutions, recordings)",
          "Use relevant proof point matched to their concern",
          "Mention 14-day money-back guarantee",
          "Ask how it sounds so far"
        ],
        "red_flags": [
          "Generic pitch not tailored to their situation",
          "Features before benefits",
          "Teacher credentials buried or mentioned as afterthought",
          "No specific numbers or proof",
          "Monologues over 3 minutes"
        ],
        "scoring": {
          "5": "Leads with teacher credentials, bridges from their specific pain, explains week structure, uses relevant proof, mentions guarantee, under 3 min",
          "4": "Good pitch but teacher credentials buried or generic proof point",
          "3": "Mentions teachers but generic pitch not tailored to their situation",
          "2": "Feature dump, no connection to their pain",
          "1": "No mention of teacher quality, no proof points, robotic feature list"
        }
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "So - how does all of that sound so far?",
        "aaa_framework": {
          "acknowledge": {"action": "Repeat their concern neutrally", "example": "I completely understand..."},
          "associate": {"action": "Connect to similar situation or proof", "example": "We hear this a lot from parents..."},
          "ask": {"action": "Return with a question to move forward", "example": "What would make this a yes for you?"}
        },
        "key_principle": "The person asking questions is closing. Never answer an objection directly.",
        "common_objections": {
          "need_to_think": "I completely understand. What would make this a yes for you? ... Try the £10 trial - 10 days, full access, no auto-renewal.",
          "talk_to_spouse": "Completely understand. If this was completely up to you, would you have any hesitation? ... We have a 14-day money-back guarantee, so they can see it in action.",
          "too_expensive": "I completely understand - it''s a real investment. This works out to £4-5 per lesson versus £50 for a tutor. ... We have monthly at £80/month, cancel anytime.",
          "want_one_to_one": "Students ask questions in chat in real-time. On average, each student sends around 25 messages per lesson. No cameras, no speaking out loud - shy students often participate MORE.",
          "times_dont_work": "Every lesson is recorded. Loads of students have football, music - they catch up later. Some prefer it because they can pause and rewind."
        },
        "scoring": {
          "5": "Uses AAA on all objections, responds with questions, identifies obstacle type",
          "4": "Uses AAA mostly but answered one objection directly",
          "3": "Handles some objections but answers directly rather than with questions",
          "2": "Gets flustered by objections, defensive responses",
          "1": "No objection handling, argues with prospect, or avoids objections"
        }
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1-2 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial. Stay on line for payment.",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So let me walk you through the investment. An average private tutor charges around £50 an hour. Two lessons a week per subject - that''s [X] lessons a month. With us, you get our top 1% teachers for just £[price] for the full course. That works out to around £4-5 per lesson. You can pay upfront and save an extra 5%, or split it into 3 monthly instalments.",
        "tier_1_ask": "The next class for [Child] is [Day]. Should I get [Child] set up so they can start this week?",
        "tier_2_monthly": "Or if you''d prefer flexibility, we have monthly at £[80-180]/month - no lock-in, cancel anytime.",
        "tier_3_trial": "Tell you what - try it for 10 days, just £10. Full access. No auto-renewal. Fair?",
        "after_yes": "Great choice. I''m sending you the registration link now. I''m happy to stay on the line while you register - it should only take 1 or 2 minutes.",
        "payment_confirmation": "Perfect, I can see that''s gone through. [Child] is all set! You''ll get an email to set up your parent account, and then [Child]''s student account. [Child]''s first class is [Day] at [Time].",
        "red_flags": [
          "Leading with £10 trial (underselling)",
          "No downsell path",
          "Keeps talking after yes",
          "Multiple competing CTAs",
          "Not staying on line for payment confirmation"
        ],
        "scoring": {
          "5": "Leads with Annual, has downsell path, stops talking after yes, stays on line for payment, clear next steps",
          "4": "Good close but rushed or skipped a tier",
          "3": "Closes but leads with Monthly or no clear downsell path",
          "2": "Weak close, multiple CTAs, keeps selling after yes",
          "1": "Leads with £10 trial, no close attempt, or high-pressure tactics"
        }
      }
    },
    "conviction_tonality": {
      "rules": {
        "statements_down": "End statements with DOWNWARD inflection. Sounds certain.",
        "questions_up": "End questions with UPWARD inflection. Invites response.",
        "slow_on_proof": "When you say credentials or stats, SLOW DOWN. Let it land.",
        "pause_after_key": "After important points, pause 1-2 seconds. Silence = confidence.",
        "match_energy": "If they''re calm, stay calm. If they''re stressed, acknowledge but don''t amp up.",
        "use_names": "Use their name and child''s name throughout. Creates connection."
      },
      "banned_phrases": [
        "Personalised learning (inaccurate for 1-many model)",
        "Maths can be fun! (parents want results, not fun)",
        "World-class / Best-in-class (without specific proof)",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING! (fake enthusiasm)",
        "How are you today? (opener time-waster)"
      ],
      "scoring": {
        "5": "Uses names throughout, active listening cues, sounds human/natural, no banned phrases",
        "4": "Mostly natural but some corporate language",
        "3": "Functional but robotic in places",
        "2": "Overly scripted, some banned phrases",
        "1": "Robotic reading, banned phrases, no personalization, fake enthusiasm"
      }
    },
    "overall_scoring": {
      "calculation": "(Sum of 8 section scores / 40) x 100",
      "grades": {
        "A": {"range": "90-100", "meaning": "Excellent - ready to close independently"},
        "B": {"range": "80-89", "meaning": "Good - minor coaching needed"},
        "C": {"range": "70-79", "meaning": "Adequate - clear coaching opportunities"},
        "D": {"range": "60-69", "meaning": "Needs work - significant gaps"},
        "F": {"range": "Below 60", "meaning": "Critical - requires intensive coaching"}
      },
      "top_issues_priority": [
        "Pain Cycle Missing/Weak (CRITICAL) - If Overview scores 1-2, this is always issue #1",
        "Features Before Outcomes - If pitch leads with workbooks/classes before teacher credentials/outcomes",
        "Teacher Credentials Buried - If teacher quality mentioned late or briefly",
        "No Tiered Close - If led with trial or no downsell path",
        "Weak Opening - If How are you today? or no agenda"
      ]
    }
  }'::jsonb
);

-- GCSE Script (Year 10-11: Maths, English, Biology, Chemistry, Physics)
insert into scripts (name, course, version, is_active, content) values (
  'GCSE Sales Script v1',
  'GCSE',
  1,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "10-15 minutes",
    "course_details": {
      "name": "GCSE (Year 10-11)",
      "year_groups": ["Year 10", "Year 11"],
      "subjects": ["Maths", "English", "Biology", "Chemistry", "Physics"],
      "teachers": {
        "Maths": {"name": "Neil Trivedi / Joe Sim / Guy Maycock", "credentials": "9-12+ years teaching, 1st Class from UCL / Warwick, 10+ years examining"},
        "English": {"name": "Alex Sarychkin / Eleanor St John Sutton", "credentials": "11+ years / 6+ years, Double 1st from UPenn"},
        "Biology": {"name": "Joe Wolfensohn / Laura Armstrong", "credentials": "22+ years combined, 10+ years examining"},
        "Chemistry": {"name": "Manny Opoku / Lajoy Tucker", "credentials": "16+ years combined, BSc from Imperial, MSc from Oxford"},
        "Physics": {"name": "Dario Papavassilou / Brook Edgar", "credentials": "12+ years combined, 1st Class MSc & PhD"}
      },
      "schedule_note": "2 live lessons per week per subject, weekday evenings",
      "exam_year_bonus": "Easter Revision Course and Cram Course included for Year 11 - led by actual examiners"
    },
    "pricing": {
      "annual_1_subject": {"price": 319, "original": 480, "lessons": 74, "payment_plan": "3x £106.33"},
      "annual_2_subjects": {"price": 574.20, "original": 864, "lessons": 148, "payment_plan": "3x £191.40"},
      "annual_ultimate": {"price": 789, "original": 1080, "lessons": 222, "payment_plan": "3x £263"},
      "multi_year_1": {"price": 669, "original": 1280, "lessons": 148, "payment_plan": "3x £223"},
      "multi_year_ultimate": {"price": 1589, "original": 2880, "lessons": 444, "payment_plan": "3x £529.67"},
      "monthly": {"1_subject": 80, "2_subjects": 144, "ultimate": 180},
      "trial": {"price": 10, "duration": "10 days"},
      "upfront_discount": "5% off if paid upfront",
      "sibling_discount": "20% off less expensive package"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation with me. Just to let you know, this call is recorded for training purposes. Is that okay? Brilliant. We''ve helped over 21,000 students across the UK improve their grades and confidence - and last year, 58% of our GCSE students achieved grades 7-9, which is more than double the national average. On this call, I''d love to understand what''s going on with your child, show you how we might help, and see if it''s a good fit. Should take about 10 minutes. How does that sound?",
        "required_elements": [
          "Greet + confirm speaking with right person",
          "Recording disclosure",
          "Proof/credibility (21,000+ students, 58% GCSE 7-9)",
          "Promise + Plan + Micro-commitment"
        ]
      },
      "clarify": {
        "name": "C - Clarify + Kill Zombies",
        "duration": "2-3 min",
        "goal": "Get details and handle decision-maker upfront",
        "exact_script": [
          "So first things first - what''s your child''s name?",
          "Any other children who might benefit too?",
          "What year is [Child] in?",
          "For GCSE, we offer Maths, English, Biology, Chemistry, and Physics. Which subjects are you interested in?",
          "Before I tell you more - is it only you making this decision, or should we get someone else involved upfront?"
        ]
      },
      "label": {
        "name": "L - Label + Discovery",
        "duration": "1-2 min",
        "goal": "Understand their situation and confirm back",
        "exact_script": [
          "What''s been going on with [Child]''s education that made you reach out?",
          "What would success look like by the end of this school year?",
          "What made you reach out now?",
          "So let me make sure I''ve got this right. [Child] is in [Year] taking [Subjects]. The main challenge is [pain]. And what you really want is [goal]. Is that right?"
        ]
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE.",
        "exact_script": [
          "Before reaching out to us, what have you tried so far to help [Child]?",
          "And how did that go?",
          "Okay. And what else have you tried?",
          "So you''ve tried [list], and none of it has quite worked. How long has this been going on?",
          "And if things stay the way they are - what does that mean for [Child] by exam time?"
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes with teacher credentials",
        "teacher_intro": "Our teachers are in the top 1% in the country. For GCSE, you get teachers like Neil Trivedi - 9+ years, 1st Class from UCL, or Guy Maycock with 12+ years and a decade of examining experience. They know exactly what the markers are looking for.",
        "how_it_works": "[Child] gets 2 live lessons every week per subject with workbooks, practice problems with video solutions, and every lesson recorded.",
        "gcse_bonus": "Because [Child] is in Year 11, the package includes our Easter Revision Course and Cram Course - led by actual examiners.",
        "proof": "Last year, 58% of our GCSE students achieved grades 7-9 - more than double the national average. 95% parent satisfaction and 1,700+ five-star Trustpilot reviews."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask"
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1-2 min",
        "goal": "Tiered close with GCSE-specific urgency",
        "tier_1_annual": "The full course is £[price]. That works out to around £4-5 per lesson versus £50 for a tutor. You can pay upfront for 5% off or split into 3 instalments.",
        "multi_year_option": "For Year 10, I''d recommend our Multi-Year package - it covers through to GCSEs next year, including Summer School, Easter Revision, and Cram Course.",
        "tier_2_monthly": "Monthly at £[80-180]/month - no lock-in, cancel anytime. Note: Monthly doesn''t include Easter Revision or Cram Course.",
        "tier_3_trial": "Try it for 10 days, just £10. Full access. No auto-renewal.",
        "exam_year_downsell": "If the full course isn''t right, we have a standalone Easter Revision Course specifically for GCSE students."
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalised learning",
        "Maths can be fun!",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);

-- A-Level Script (Year 12-13)
insert into scripts (name, course, version, is_active, content) values (
  'A-Level Sales Script v1',
  'A-Level',
  1,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "10-15 minutes",
    "course_details": {
      "name": "A-Level (Year 12-13)",
      "year_groups": ["Year 12", "Year 13"],
      "subjects": ["Maths", "Biology", "Chemistry", "Physics", "Further Maths", "English Literature"],
      "teachers": {
        "Maths": {"name": "Guy Maycock / Neil Trivedi", "credentials": "12+ years teaching, 10+ years A-Level examining / 9+ years, 1st Class from UCL"},
        "Biology": {"name": "Laura Armstrong / Joe Wolfensohn", "credentials": "22+ years combined, 10+ years examining"},
        "Chemistry": {"name": "Manny Opoku / Lajoy Tucker / Davinder Bhachu", "credentials": "Imperial, Oxford & UCL graduates"},
        "Physics": {"name": "Dario Papavassilou / Brook Edgar", "credentials": "1st Class MSc & PhD"},
        "Further Maths": {"name": "Guy Maycock / Nick Featherstone", "credentials": "27+ years combined, Masters from Oxford"},
        "English Literature": {"name": "Eleanor St John Sutton", "credentials": "6+ years teaching, Double 1st from UPenn"}
      },
      "schedule_note": "2 live lessons per week per subject",
      "exam_year_bonus": "Easter Revision Course and Cram Course included for Year 13"
    },
    "pricing": {
      "annual_1_subject": {"price": 319, "original": 480, "lessons": 74},
      "annual_2_subjects": {"price": 574.20, "original": 864, "lessons": 148},
      "annual_ultimate": {"price": 789, "original": 1080, "lessons": 222},
      "monthly": {"1_subject": 80, "2_subjects": 144, "ultimate": 180},
      "trial": {"price": 10, "duration": "10 days"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation. This call is recorded for training purposes - is that okay? Brilliant. We''ve helped over 21,000 students across the UK, and our students perform on average 3x better than national averages. On this call, I''d love to understand what''s going on, show you how we might help, and see if it''s a good fit. About 10 minutes. How does that sound?"
      },
      "clarify": {
        "name": "C - Clarify + Kill Zombies",
        "duration": "2-3 min",
        "goal": "Get details and handle decision-maker upfront",
        "exact_script": [
          "What''s your child''s name?",
          "Any siblings who might need support too?",
          "What year are they in?",
          "For A-Level, we offer Maths, Biology, Chemistry, Physics, Further Maths, and English Literature. Which subjects?",
          "Is it only you making this decision, or should we get someone else involved?"
        ]
      },
      "label": {
        "name": "L - Label + Discovery",
        "duration": "1-2 min",
        "goal": "Understand and confirm back"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE."
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Lead with teacher credentials, A-Level specific",
        "teacher_intro": "For A-Level, you get teachers like Guy Maycock - 12+ years teaching and over a decade as an A-Level examiner. He literally knows what the markers are looking for. Laura Armstrong in Biology has 10+ years examining experience."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask"
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1-2 min",
        "goal": "Tiered close"
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalised learning",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);

-- Primary Script (Year 5-6: Maths, English, Science, 11+)
insert into scripts (name, course, version, is_active, content) values (
  'Primary Sales Script v1',
  'Primary',
  1,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "10-15 minutes",
    "course_details": {
      "name": "Primary (Year 5-6)",
      "year_groups": ["Year 5", "Year 6"],
      "subjects": ["Maths", "English", "Science", "11+"],
      "teachers": {
        "Maths": {"name": "Neil Trivedi", "credentials": "9+ years teaching, 1st Class in Maths from UCL"},
        "English": {"name": "Louis Provis", "credentials": "11+ years teaching, MAs from Cambridge & Oxford"},
        "Science": {"name": "Lajoy Tucker, Hannah Shuter & Emma Williams", "credentials": "40+ years combined"},
        "11+": {"name": "Nick Featherstone & Louis Provis", "credentials": "26+ years combined, Masters from Oxford"}
      },
      "schedule_note": "2 live lessons per week per subject, weekday afternoons/evenings"
    },
    "pricing": {
      "annual_1_subject": {"price": 319, "original": 480, "lessons": 74},
      "annual_2_subjects": {"price": 574.20, "original": 864, "lessons": 148},
      "annual_ultimate": {"price": 789, "original": 1080, "lessons": 222},
      "monthly": {"1_subject": 80, "2_subjects": 144, "ultimate": 180},
      "trial": {"price": 10, "duration": "10 days"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation. This call is recorded for training purposes - is that okay? Brilliant. We''ve helped over 21,000 students across the UK improve their grades and confidence. On this call, I''d love to understand what''s going on, show you how we might help, and see if it''s a good fit. About 10 minutes. How does that sound?"
      },
      "clarify": {
        "name": "C - Clarify + Kill Zombies",
        "duration": "2-3 min",
        "goal": "Get details",
        "exact_script": [
          "What''s your child''s name?",
          "Any siblings?",
          "What year are they in?",
          "For Year 5, we offer Maths, English, Science, and 11+ prep. Which are you interested in?",
          "Is it only you making this decision?"
        ]
      },
      "label": {
        "name": "L - Label + Discovery",
        "duration": "1-2 min",
        "goal": "Understand and confirm back"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts",
        "importance": "THIS IS THE MOST IMPORTANT PHASE."
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Lead with teacher credentials",
        "teacher_intro": "For Year 5 Maths, [Child] will be taught by Neil Trivedi - 9+ years of teaching, 1st Class in Maths from UCL. For English, Louis Provis with MAs from both Cambridge and Oxford. These aren''t just any teachers."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections"
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1-2 min",
        "goal": "Tiered close"
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalised learning",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);
