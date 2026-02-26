-- Seed Scripts for RepCoach (UK)
-- CLOSER Framework (Hormozi methodology) sales scripts for MyEdSpace UK
-- Based on official MyEdSpace UK sales methodology

-- Delete existing scripts to replace with updated versions
delete from scripts where course in ('Year 5-6', 'Year 7-9', 'Year 10-11', 'Year 12-13');

-- Year 5-6 Script
insert into scripts (name, course, version, is_active, content) values (
  'Year 5-6 Sales Script v2',
  'Year 5-6',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Year 5-6",
      "subjects": "Maths, English, Science (+ 11+ for Year 5)",
      "schedule": {
        "days": "Mon-Fri",
        "time": "16:30-18:25"
      }
    },
    "pricing": {
      "annual_standard_1_subject": {"price": 319, "payment_plan": "3 monthly instalments", "framing": "Around £4-5 per hour"},
      "monthly_standard_1_subject": {"price": 80, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 10, "duration": "10 days", "framing": "Full access, no auto-renewal"},
      "sibling_discount": "20% off the less expensive package",
      "upfront_discount": "5% off if paid upfront"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped over 21,000 students across the UK, including a lot in Year 5 and 6 specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Year Group] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (21,000+ students)",
          "Promise outcome (understand situation, show how to help, see if it makes sense)",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ],
        "red_flags": [
          "How are you today? opener (conversion killer)",
          "Launching into product pitch immediately",
          "No agenda setting",
          "Long company introduction"
        ],
        "scoring": {
          "5": "Sets agenda immediately, includes proof/credibility, states promise, outlines plan, gets micro-commitment, under 60 sec",
          "4": "Has most elements but missing one (e.g., no micro-commitment)",
          "3": "Has agenda but missing proof OR promise",
          "2": "Long company intro, no clear agenda",
          "1": "How are you today? opener, launches into pitch, no agenda"
        }
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on that made you reach out?",
          "[Let them talk. Take notes. Use their words later.]",
          "Got it. And what year is [Child] in? Which subjects are you most interested in?",
          "[Confirm subjects: Maths, English, Science, 11+]",
          "What would success look like for [Child] by the end of this school year?",
          "[This is their stated goal. Reference it in the close.]",
          "And what made you reach out NOW versus a few months ago?",
          "[This reveals urgency. Recent bad report? Upcoming test? Frustration boiling over?]"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s year group and subjects",
          "Ask about their goal/success criteria",
          "Uncover urgency trigger"
        ],
        "red_flags": [
          "Assuming problem without asking",
          "Only yes/no questions",
          "Rep talks more than prospect",
          "Not uncovering the why now"
        ],
        "scoring": {
          "5": "Asks why they reached out, gets them to state problem, covers year group/subjects, asks about goals, uncovers urgency, uses open-ended questions, listens more than talks",
          "4": "Good discovery but misses one element (e.g., no urgency question)",
          "3": "Some discovery but relies on closed yes/no questions",
          "2": "Minimal discovery, moves quickly to pitch",
          "1": "Assumes problem without asking, talks more than listens"
        }
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": [
          "Okay, so let me make sure I''ve got this right. [Child] is in [Year Group] and you''re looking at help with [Subject(s)]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?",
          "[Wait for confirmation. If they add something, incorporate it.]",
          "Got it. That''s really helpful."
        ],
        "required_elements": [
          "Restate problem using THEIR words",
          "Include year group, subjects, specific challenge, and goal",
          "Get verbal confirmation (Is that accurate? / Is that right?)",
          "Acknowledge their input"
        ],
        "scoring": {
          "5": "Restates problem using their words, includes year group/subjects/challenge/goal, gets verbal confirmation",
          "4": "Good summary but confirmation was weak",
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
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child]?",
          "[Common answers: YouTube videos, BBC Bitesize, hired a tutor, parent tried helping, extra homework from school]",
          "Okay, and how did that go?",
          "[Let them explain why it didn''t work. Don''t interrupt.]",
          "Got it. What else have you tried?",
          "[Keep asking ''what else?'' until they''ve exhausted all prior attempts]",
          "Anything else?",
          "[Once exhausted, summarize:]",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "[Then dig into duration and consequences:]",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get sorted?"
        ],
        "active_listening_cues": [
          "That makes sense.",
          "I hear that a lot.",
          "That''s really common at this age."
        ],
        "required_elements": [
          "Ask about ALL past attempts",
          "Follow up with How did that go? for EACH attempt",
          "Exhaust with What else? until nothing left",
          "Summarize and confirm all attempts failed",
          "Ask about duration",
          "Ask about consequences if nothing changes"
        ],
        "scoring": {
          "5": "Asks about past attempts, follows up with how did that go? for each, exhausts with what else? until nothing left, summarizes all failed attempts, asks about duration, asks about consequences",
          "4": "Good pain cycle but didn''t fully exhaust or missed consequences",
          "3": "Asks about past attempts but doesn''t go deep, moves on after 1-2 attempts",
          "2": "Minimal exploration, token question about past attempts",
          "1": "Skips pain cycle entirely, goes straight to pitch (CRITICAL FAILURE)"
        }
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with teacher credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "teacher_intro": "So our teachers are in the top 1% in the country. We''ve got degrees from Oxford, Cambridge, UCL, Imperial, and Warwick. Combined over 100 years of teaching experience. We screened over 3,000 teachers to find them. What makes them different is how they explain things. They can take something confusing and make it click. Parents tell us their kids actually start enjoying learning, which I know sounds crazy.",
        "teacher_credentials": {
          "quality": "Top 1% of teachers in the UK",
          "universities": "Oxford, Cambridge, UCL, Imperial, Warwick",
          "experience": "Combined 100+ years of teaching experience",
          "selection": "Screened 3,000+ teachers",
          "trust": "21,000+ students helped"
        },
        "pain_bridges": {
          "homework_takes_forever": "You mentioned homework is taking ages. What parents tell us is that gets much easier because [Child] actually understands the concepts instead of guessing.",
          "child_hates_subject": "You mentioned [Child] doesn''t enjoy it. 95% of parents report satisfaction with our teaching. They actually start showing up because it feels different than school.",
          "tutoring_expensive": "You mentioned tutoring costs were a concern. Instead of £50+ an hour for a private tutor, it starts from £80 a month for everything - live classes twice a week, workbooks, practice problems, video solutions. Elite teaching at a fraction of the cost."
        },
        "how_it_works": "[Child] joins live twice a week per subject. Our teachers are teaching in real-time, kids are chatting and asking questions. No cameras, no speaking out loud - just typing in chat. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need.",
        "proof_points": {
          "engagement": "~25 messages per student per lesson",
          "results": "58% GCSE grades 7-9",
          "quality": "1,700+ Trustpilot reviews, 95% parent satisfaction",
          "price": "from £80/mo vs £50+/hr tutors (£200+/mo)",
          "trust": "21,000+ students helped. Top 1% teachers.",
          "urgency": "Curriculum builds. Wait = gaps. 14-day guarantee = no risk."
        },
        "required_elements": [
          "Lead with teacher credentials (top 1%, Oxford/Cambridge/UCL/Imperial, 100+ years, 3000+ screened)",
          "Bridge from their specific pain point (not generic pitch)",
          "Paint outcome picture (confident kid, easier homework - NOT features)",
          "Use relevant proof point matched to their concern",
          "Keep brief - under 3 minutes"
        ],
        "scoring": {
          "5": "Leads with teacher credentials, bridges from their specific pain, paints outcome (not features), uses relevant proof point, keeps under 3 min",
          "4": "Good pitch but credentials buried or generic proof point",
          "3": "Mentions teachers but generic pitch not tailored to their situation",
          "2": "Feature dump, no connection to their pain",
          "1": "No mention of credentials, no proof points, robotic feature list"
        }
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the programme works?",
        "aaa_framework": {
          "acknowledge": {"action": "Repeat their concern neutrally", "example": "Totally understand - you want to make sure it''s worth it."},
          "associate": {"action": "Connect to success story or similar situation", "example": "A lot of parents felt that way. One mum told me..."},
          "ask": {"action": "Return with a question to move forward", "example": "If budget weren''t a factor, would this be right for [Child]?"}
        },
        "key_principle": "The person asking questions is closing. Never answer an objection directly. Respond with a question about their question.",
        "objection_responses": {
          "too_expensive": {
            "response": "Totally understand - you want to make sure it''s worth it. Quick question: what are you comparing us to?",
            "if_private_tutoring": "Right, so private tutors run £50+ an hour. For 8 sessions a month, that''s £400+. We start from £80 for everything - better teachers, more support. And we have a 14-day money-back guarantee. If it''s not working, full refund. Does that change how it feels?"
          },
          "talk_to_spouse": {
            "response": "Makes total sense. What questions do you think they''ll have? I can help you answer them.",
            "then": "Here''s an option: start the £10 trial together this week. You can both see it in action before deciding. That way you''re making an informed decision together instead of guessing."
          },
          "need_to_think": {
            "response": "Totally get it. What''s your main concern? What are you afraid of having happen?",
            "if_vague": "Here''s the thing - you''re not going to go home and stare at the wall thinking about maths class. You''ll get busy, a week goes by, [Child] has another rough test. What information do you still need to decide? I''m your information source right now."
          },
          "wont_engage_online": {
            "response": "I hear that a lot - usually from parents whose kids tried boring recorded videos. This is different. It''s live. Kids are chatting, asking questions in real-time. We see around 25 messages per student per lesson. No cameras, no speaking - just typing. Try the £10 trial and see for yourself."
          }
        },
        "scoring": {
          "5": "Uses AAA (Acknowledge-Associate-Ask) on all objections, responds with questions, identifies obstacle type (circumstances/others/self), has stacked closes ready",
          "4": "Uses AAA mostly but answered one objection directly",
          "3": "Handles some objections but answers directly rather than with questions",
          "2": "Gets flustered by objections, defensive responses",
          "1": "No objection handling, argues with prospect, or avoids objections"
        }
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": {
          "script": "So here''s what most parents do. The full year for one subject is £319 - that''s around £4-5 per hour of elite teaching, plus all the workbooks, practice problems, and video solutions. You can pay upfront and save 5%, or split it into 3 monthly instalments.",
          "ask": "Based on what you told me about [reference their goal], I''d recommend the full year so [Child] gets the complete curriculum with no gaps. Should I get [Child] set up?",
          "if_yes": "STOP. Close immediately. Move to next steps."
        },
        "tier_2_monthly": {
          "trigger": "If price objection",
          "script": "Totally fair. We also have monthly from £80. No long-term commitment - you can cancel anytime. A lot of parents start there and switch to annual once they see [Child] loving it. Want to start with monthly?"
        },
        "tier_3_trial": {
          "trigger": "Last resort",
          "script": "Tell you what. I can see you want to make sure this is right for [Child]. Try it for £10 for 10 days. Full access to everything - the live classes, workbooks, all of it. No auto-renewal. If it''s not a fit, it just expires. But if [Child] loves it, you''re set. Fair?"
        },
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. Once you complete that, you''ll get an email to set up your parent account and then [Child]''s student account. [Child] can join their first class this week. Any questions before I send the link?",
        "scoring": {
          "5": "Leads with Annual, has downsell path (Annual->Monthly->Trial), stops talking after yes, clear next steps",
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
        "1": "Robotic reading, banned phrases, no personalisation, fake enthusiasm"
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
        "Features Before Outcomes - If pitch leads with workbooks/classes before credentials/outcomes",
        "Credentials Buried - If teacher credentials mentioned late or briefly",
        "No Tiered Close - If led with trial or no downsell path",
        "Weak Opening - If How are you today? or no agenda"
      ]
    }
  }'::jsonb
);

-- Year 7-9 Script
insert into scripts (name, course, version, is_active, content) values (
  'Year 7-9 Sales Script v2',
  'Year 7-9',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Year 7-9",
      "subjects": "Maths, English, Science",
      "schedule": {
        "days": "Mon-Fri",
        "time": "16:30-18:40"
      }
    },
    "pricing": {
      "annual_standard_1_subject": {"price": 319, "payment_plan": "3 monthly instalments", "framing": "Around £4-5 per hour"},
      "monthly_standard_1_subject": {"price": 80, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 10, "duration": "10 days", "framing": "Full access, no auto-renewal"},
      "sibling_discount": "20% off the less expensive package",
      "upfront_discount": "5% off if paid upfront"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped over 21,000 students across the UK, including a lot in Year 7-9 specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Year Group] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (21,000+ students)",
          "Promise outcome",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on that made you reach out?",
          "Got it. And what year is [Child] in? Which subjects are you most interested in?",
          "What would success look like for [Child] by the end of this school year?",
          "And what made you reach out NOW versus a few months ago?"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s year group and subjects",
          "Ask about their goal/success criteria",
          "Uncover urgency trigger"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Year Group] and you''re looking at help with [Subject(s)]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?",
        "required_elements": [
          "Restate problem using THEIR words",
          "Include year group, subjects, specific challenge, and goal",
          "Get verbal confirmation",
          "Acknowledge their input"
        ]
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child]?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get sorted?"
        ],
        "active_listening_cues": [
          "That makes sense.",
          "I hear that a lot.",
          "That''s really common at this age."
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with teacher credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "teacher_intro": "So our teachers are in the top 1% in the country. We''ve got degrees from Oxford, Cambridge, UCL, Imperial, and Warwick. Combined over 100 years of teaching experience. We screened over 3,000 teachers to find them. What makes them different is how they explain things. They can take something confusing and make it click. Parents tell us their kids actually start enjoying learning, which I know sounds crazy.",
        "how_it_works": "[Child] joins live twice a week per subject. Our teachers are teaching in real-time, kids are chatting and asking questions. No cameras, no speaking - just typing in chat. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need.",
        "proof_points": {
          "engagement": "~25 messages per student per lesson",
          "results": "58% GCSE grades 7-9",
          "quality": "1,700+ Trustpilot reviews, 95% parent satisfaction",
          "price": "from £80/mo vs £50+/hr tutors (£200+/mo)"
        }
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the programme works?",
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full year for one subject is £319 - that''s around £4-5 per hour of elite teaching, plus all the workbooks, practice problems, and video solutions.",
        "tier_2_monthly": "Totally fair. We also have monthly from £80. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for £10 for 10 days. Full access to everything. No auto-renewal. If it''s not a fit, it just expires.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class this week."
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

-- Year 10-11 (GCSE) Script
insert into scripts (name, course, version, is_active, content) values (
  'Year 10-11 Sales Script v2',
  'Year 10-11',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Year 10-11",
      "subjects": "Maths, English, Biology, Chemistry, Physics",
      "schedule": {
        "days": "Mon-Fri",
        "time": "16:30-21:00"
      }
    },
    "pricing": {
      "annual_standard_1_subject": {"price": 319, "payment_plan": "3 monthly instalments", "framing": "Around £4-5 per hour"},
      "monthly_standard_1_subject": {"price": 80, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 10, "duration": "10 days", "framing": "Full access, no auto-renewal"},
      "sibling_discount": "20% off the less expensive package",
      "upfront_discount": "5% off if paid upfront"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped over 21,000 students across the UK, including a lot preparing for GCSEs. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Year Group] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (21,000+ students)",
          "Promise outcome",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on that made you reach out?",
          "Got it. And what year is [Child] in? Which GCSE subjects are they finding hardest?",
          "What would success look like for [Child] in their GCSEs?",
          "And what made you reach out NOW versus a few months ago?"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s year group and GCSE subjects",
          "Ask about their goal/success criteria",
          "Uncover urgency trigger"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Year Group] preparing for GCSEs in [Subject(s)]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with their GCSEs?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? What does GCSE results day look like?"
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with teacher credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "teacher_intro": "So our teachers are in the top 1% in the country. We''ve got degrees from Oxford, Cambridge, UCL, Imperial, and Warwick. Combined over 100 years of teaching experience. We screened over 3,000 teachers to find them. 58% of our GCSE students scored grades 7-9. Parents tell us their kids actually start feeling confident, which I know sounds crazy when they''re stressed about GCSEs.",
        "how_it_works": "[Child] joins live twice a week per subject. Our teachers are teaching in real-time, kids are chatting and asking questions. No cameras, no speaking - just typing in chat. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need for GCSEs."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with their GCSEs? Any questions about how the programme works?",
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full year for one GCSE subject is £319 - that''s around £4-5 per hour of elite teaching, plus all the workbooks, practice problems, and video solutions. And we have multi-subject bundles if [Child] needs help across more than one subject.",
        "tier_2_monthly": "Totally fair. We also have monthly from £80. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for £10 for 10 days. Full access to everything. No auto-renewal. If it''s not a fit, it just expires.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class this week."
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

-- Year 12-13 (A-Level) Script
insert into scripts (name, course, version, is_active, content) values (
  'Year 12-13 Sales Script v2',
  'Year 12-13',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Year 12-13",
      "subjects": "Maths, Sciences, Further Maths, English Literature",
      "schedule": {
        "days": "Mon-Fri",
        "time": "16:30-20:50"
      }
    },
    "pricing": {
      "annual_standard_1_subject": {"price": 319, "payment_plan": "3 monthly instalments", "framing": "Around £4-5 per hour"},
      "monthly_standard_1_subject": {"price": 80, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 10, "duration": "10 days", "framing": "Full access, no auto-renewal"},
      "sibling_discount": "20% off the less expensive package",
      "upfront_discount": "5% off if paid upfront"
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped over 21,000 students across the UK, including a lot at A-Level. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Year Group] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (21,000+ students)",
          "Promise outcome",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on that made you reach out?",
          "Got it. And what year is [Child] in? Which A-Level subjects are they finding toughest?",
          "What would success look like for [Child] in their A-Levels? Are they aiming for specific uni courses?",
          "And what made you reach out NOW versus a few months ago?"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s year group and A-Level subjects",
          "Ask about their goal/success criteria (university aspirations)",
          "Uncover urgency trigger"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Year Group] studying [Subject(s)] at A-Level. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with their A-Levels?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? What does A-Level results day look like? Does it affect their university plans?"
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with teacher credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "teacher_intro": "So our teachers are in the top 1% in the country. We''ve got degrees from Oxford, Cambridge, UCL, Imperial, and Warwick. Combined over 100 years of teaching experience. We screened over 3,000 teachers to find them. At A-Level, the quality of teaching really matters - and our teachers know exactly what examiners are looking for.",
        "how_it_works": "[Child] joins live twice a week per subject. Our teachers are teaching in real-time, students are chatting and asking questions. No cameras, no speaking - just typing in chat. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need for A-Levels."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with their A-Levels? Any questions about how the programme works?",
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full year for one A-Level subject is £319 - that''s around £4-5 per hour of elite teaching, plus all the workbooks, practice problems, and video solutions. And we have multi-subject bundles.",
        "tier_2_monthly": "Totally fair. We also have monthly from £80. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for £10 for 10 days. Full access to everything. No auto-renewal. If it''s not a fit, it just expires.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class this week."
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
