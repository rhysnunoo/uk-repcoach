-- Seed Scripts for RepCoach
-- CLOSER Framework (Hormozi methodology) sales scripts for MyEdSpace courses
-- Based on official MyEdSpace sales methodology

-- Delete existing scripts to replace with updated versions
delete from scripts where course in ('Pre-Algebra', 'Algebra 1', 'Geometry', 'Algebra 2');

-- Universal Script (applies to all courses)
-- The script content is the same structure for all courses, just with course-specific details inserted
insert into scripts (name, course, version, is_active, content) values (
  'Pre-Algebra Sales Script v2',
  'Pre-Algebra',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Pre-Algebra",
      "schedule": {
        "days": "Mon & Wed",
        "pacific_time": "5pm",
        "eastern_time": "8pm"
      }
    },
    "pricing": {
      "annual_premium": {"price": 539, "payment_plan": "3x $180", "framing": "Less than $17/hr for 60 hours"},
      "annual_essentials": {"price": 489, "payment_plan": "3x $163", "framing": "Save vs monthly"},
      "monthly_premium": {"price": 149, "framing": "No lock-in, cancel anytime"},
      "monthly_essentials": {"price": 135, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 7, "duration": "7 days", "framing": "Full access, risk-free test"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped thousands of parents get their kids confident in math, including a lot in Pre-Algebra specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Grade] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (thousands of parents)",
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
          "So what''s going on with math that made you reach out?",
          "[Let them talk. Take notes. Use their words later.]",
          "Got it. And what grade is [Child] in? Which math course are they taking right now?",
          "[Confirm course fit: Pre-Algebra, Algebra 1, Geometry, or Algebra 2]",
          "What would success look like for [Child] by the end of this school year?",
          "[This is their stated goal. Reference it in the close.]",
          "And what made you reach out NOW versus a few months ago?",
          "[This reveals urgency. Recent bad grade? Upcoming test? Frustration boiling over?]"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s grade level and current course",
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
          "5": "Asks why they reached out, gets them to state problem, covers grade/course, asks about goals, uncovers urgency, uses open-ended questions, listens more than talks",
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
          "Okay, so let me make sure I''ve got this right. [Child] is in [Grade] taking [Course]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?",
          "[Wait for confirmation. If they add something, incorporate it.]",
          "Got it. That''s really helpful."
        ],
        "required_elements": [
          "Restate problem using THEIR words",
          "Include grade, course, specific challenge, and goal",
          "Get verbal confirmation (Is that accurate? / Is that right?)",
          "Acknowledge their input"
        ],
        "red_flags": [
          "Skipping labeling entirely",
          "Moving to solution without confirmation",
          "Parroting exact words without synthesis",
          "Not waiting for confirmation"
        ],
        "scoring": {
          "5": "Restates problem using their words, includes grade/course/challenge/goal, gets verbal confirmation",
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
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with math?",
          "[Common answers: YouTube videos, Khan Academy, hired a tutor, parent tried helping, extra homework from school]",
          "Okay, and how did that go?",
          "[Let them explain why it didn''t work. Don''t interrupt.]",
          "Got it. What else have you tried?",
          "[Keep asking ''what else?'' until they''ve exhausted all prior attempts]",
          "Anything else?",
          "[Once exhausted, summarize:]",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "[Then dig into duration and consequences:]",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get fixed?",
          "[This makes the stakes real. Let them verbalize the consequences.]"
        ],
        "active_listening_cues": [
          "That makes sense.",
          "I hear that a lot.",
          "That''s really common at this grade."
        ],
        "required_elements": [
          "Ask about ALL past attempts",
          "Follow up with How did that go? for EACH attempt",
          "Exhaust with What else? until nothing left",
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
        "goal": "Sell outcomes not features, lead with Eddie''s credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "eddie_intro": "So the teacher is Eddie Kang. UCLA Pure Mathematics degree. Perfect SAT math score. Nine years teaching in high schools and colleges across California. We screened over 3,000 teachers to find him - he was the one. What makes Eddie different is how he explains things. He can take something confusing and make it click. Parents tell us their kids actually start enjoying math, which I know sounds crazy.",
        "eddie_credentials": {
          "degree": "Pure Mathematics degree from UCLA",
          "sat": "Perfect SAT Math score (800)",
          "experience": "9+ years teaching in CA high schools and colleges",
          "selection": "Screened 3,000+ teachers - he was the one",
          "social": "20k+ social media followers"
        },
        "pain_bridges": {
          "homework_takes_forever": "You mentioned homework is taking [X] hours. What parents tell us is that drops to 30-45 minutes because [Child] actually understands instead of guessing.",
          "child_hates_math": "You mentioned [Child] doesn''t like math. 83% of parents say their kid''s attitude toward math improved with Eddie. They actually start showing up because it feels different than school.",
          "tutoring_expensive": "You mentioned tutoring costs were a concern. Instead of $60-80 an hour for a random tutor, it''s $149 a month for everything - live classes twice a week, workbooks, practice problems, video solutions. Elite teaching at a fraction of the cost."
        },
        "how_it_works": "[Child] joins live twice a week - Mon & Wed at 5pm Pacific / 8pm Eastern. Eddie''s teaching in real-time, kids are chatting and asking questions. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need.",
        "proof_points": {
          "engagement": "20-30 chat messages per student per lesson",
          "attitude": "83% report attitude improvement",
          "quality": "Best Online School 2025, 95% parent satisfaction",
          "price": "$149/mo vs $60-80/hr tutors ($400+/mo)",
          "trust": "Eddie''s taught thousands. UCLA Math, perfect SAT.",
          "urgency": "Math builds. Wait = gaps. 30-day guarantee = no risk."
        },
        "required_elements": [
          "Lead with Eddie''s credentials (UCLA Pure Math, perfect SAT, 9 years, 3000+ screened)",
          "Bridge from their specific pain point (not generic pitch)",
          "Paint outcome picture (confident kid, easier homework - NOT features)",
          "Use relevant proof point matched to their concern",
          "Keep brief - under 3 minutes"
        ],
        "red_flags": [
          "Generic pitch not tailored to their situation",
          "Features before benefits (workbooks, practice problems...)",
          "Eddie buried in details or mentioned as afterthought",
          "No specific numbers or proof",
          "Monologues over 3 minutes",
          "Selling the plane flight (process) not vacation (outcome)"
        ],
        "scoring": {
          "5": "Leads with Eddie credentials, bridges from their specific pain, paints outcome (not features), uses relevant proof point, keeps under 3 min",
          "4": "Good pitch but Eddie buried or generic proof point",
          "3": "Mentions Eddie but generic pitch not tailored to their situation",
          "2": "Feature dump, no connection to their pain",
          "1": "No mention of Eddie, no proof points, robotic feature list"
        }
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the program works?",
        "aaa_framework": {
          "acknowledge": {"action": "Repeat their concern neutrally", "example": "Totally understand - you want to make sure it''s worth it."},
          "associate": {"action": "Connect to success story or similar situation", "example": "A lot of parents felt that way. One mom told me..."},
          "ask": {"action": "Return with a question to move forward", "example": "If budget weren''t a factor, would this be right for [Child]?"}
        },
        "key_principle": "The person asking questions is closing. Never answer an objection directly. Respond with a question about their question.",
        "obstacle_categories": {
          "circumstances": {"examples": ["Time", "Money", "Fit"], "strategy": "Address the variable directly, reframe value"},
          "others": {"examples": ["Spouse", "Partner"], "strategy": "What would their main concern be? Arm them with answers"},
          "self": {"examples": ["Avoiding decision", "Past failure"], "strategy": "What''s different this time? Best case/worst case close"}
        },
        "objection_responses": {
          "too_expensive": {
            "response": "Totally understand - you want to make sure it''s worth it. Quick question: what are you comparing us to?",
            "if_private_tutoring": "Right, so private tutors run $60-80 an hour. For 8 sessions a month, that''s $480-640. We''re $149 for everything - better teacher, more support. And we have a 30-day money-back guarantee. If it''s not working, full refund. Does that change how it feels?"
          },
          "talk_to_spouse": {
            "response": "Makes total sense. What questions do you think they''ll have? I can help you answer them.",
            "then": "Here''s an option: start the $7 trial together this week. You can both see it in action before deciding. That way you''re making an informed decision together instead of guessing."
          },
          "need_to_think": {
            "response": "Totally get it. What''s your main concern? What are you afraid of having happen?",
            "if_vague": "Here''s the thing - you''re not going to go home and stare at the wall thinking about math class. You''ll get busy, a week goes by, [Child] has another rough test. What information do you still need to decide? I''m your information source right now."
          },
          "wont_engage_online": {
            "response": "I hear that a lot - usually from parents whose kids tried boring recorded videos. This is different. It''s live. Kids are chatting, asking questions in real-time. We see 20-30 messages per student per lesson. One dad told me his son hated math - first week with Eddie, the kid asked to log in early. Try the $7 week and see for yourself."
          },
          "start_later": {
            "response": "I get wanting to wait for the right time. But here''s what we''ve found: math builds on itself. A mom I spoke with wanted to wait until things calmed down. By the time she came back, her daughter had failed the midterm and was way behind. She told me she wished she''d just started when we first talked. The 30-day guarantee means there''s no risk to starting now."
          }
        },
        "all_purpose_closes": [
          "What would make this a yes for you?",
          "What would make this a no?",
          "Best case: [Child] gets confident, homework gets easier. Worst case: you''re out $7 for the trial and learned it wasn''t the right fit. Which risk makes more sense?",
          "The reason you''re telling yourself not to do this is exactly why you should. The fact that you don''t have time is why [Child] needs the help."
        ],
        "rapid_fire_at_close": [
          "What''s your main concern?",
          "What are you afraid of having happen?",
          "What would make this a yes?",
          "What would make this a no?"
        ],
        "red_flags": [
          "Answering objections directly (loses control)",
          "Getting defensive or arguing",
          "Generic trust us responses",
          "No objection handling at all",
          "Over-explaining (desperation smell)",
          "Offering discounts to close"
        ],
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
          "script": "So here''s what most parents do. The full course is $539 for the year - that''s less than $17 an hour for 60 hours of teaching from Eddie, plus all the workbooks, practice problems, and video solutions. You can pay upfront and save an extra 5%, or split it into 3 payments of $180.",
          "ask": "Based on what you told me about [reference their goal], I''d recommend the full course so [Child] gets the complete curriculum with no gaps. Should I get [Child] set up?",
          "if_yes": "STOP. Close immediately. Move to next steps."
        },
        "tier_2_monthly": {
          "trigger": "If price objection",
          "script": "Totally fair. We also have monthly at $149. No long-term commitment - you can cancel anytime. A lot of parents start there and switch to annual once they see [Child] loving it. Want to start with monthly?"
        },
        "tier_3_trial": {
          "trigger": "Last resort",
          "script": "Tell you what. I can see you want to make sure this is right for [Child]. Try it for $7 for a week. Full access to everything - the live classes, workbooks, all of it. If it''s not a fit, you cancel, no questions. But if [Child] loves it, you''re set. Fair?"
        },
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. Once you complete that, you''ll get an email to set up your parent account and then [Child]''s student account. [Child] can join their first class on Monday at 5pm Pacific. Any questions before I send the link?",
        "tiered_flow": "Present Annual -> Yes? STOP. Close immediately. -> Price objection? Offer Monthly -> Accepted? Done -> Still hesitant? Offer Trial",
        "red_flags": [
          "Leading with $7 trial (underselling - trial-to-paid conversion is lower)",
          "No downsell path",
          "Keeps talking after yes",
          "Multiple competing CTAs",
          "High-pressure tactics or fake urgency",
          "No reinforcement after decision",
          "Not scheduling next steps (BAMFAM - Book A Meeting From A Meeting)"
        ],
        "scoring": {
          "5": "Leads with Annual, has downsell path (Annual->Monthly->Trial), stops talking after yes, clear next steps, includes BAMFAM",
          "4": "Good close but rushed or skipped a tier",
          "3": "Closes but leads with Monthly or no clear downsell path",
          "2": "Weak close, multiple CTAs, keeps selling after yes",
          "1": "Leads with $7 trial, no close attempt, or high-pressure tactics"
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
      "detectable_markers": [
        "Uses prospect''s name and child''s name",
        "Active listening cues (That makes sense, I hear that a lot, Got it)",
        "Natural conversational flow vs robotic script reading",
        "No banned phrases"
      ],
      "banned_phrases": [
        "Personalized learning (inaccurate for 1-many model)",
        "Math can be fun! (parents want results, not fun)",
        "World-class / Best-in-class (without specific proof)",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING! (fake enthusiasm)",
        "How are you today? (opener time-waster)"
      ],
      "authenticity_check": [
        "Would I talk to a friend this way?",
        "Am I leading with their need or my pitch?",
        "Would I trust someone talking to me like this?",
        "Would I buy this for my own kid?"
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
        "Features Before Outcomes - If pitch leads with workbooks/classes before Eddie/outcomes",
        "Eddie Buried - If Eddie credentials mentioned late or briefly",
        "No Tiered Close - If led with trial or no downsell path",
        "Weak Opening - If How are you today? or no agenda"
      ]
    }
  }'::jsonb
);

-- Algebra 1 Script
insert into scripts (name, course, version, is_active, content) values (
  'Algebra 1 Sales Script v2',
  'Algebra 1',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Algebra 1",
      "schedule": {
        "days": "Tue & Thu",
        "pacific_time": "5pm",
        "eastern_time": "8pm"
      }
    },
    "pricing": {
      "annual_premium": {"price": 539, "payment_plan": "3x $180", "framing": "Less than $17/hr for 60 hours"},
      "annual_essentials": {"price": 489, "payment_plan": "3x $163", "framing": "Save vs monthly"},
      "monthly_premium": {"price": 149, "framing": "No lock-in, cancel anytime"},
      "monthly_essentials": {"price": 135, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 7, "duration": "7 days", "framing": "Full access, risk-free test"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped thousands of parents get their kids confident in math, including a lot in Algebra 1 specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Grade] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (thousands of parents)",
          "Promise outcome (understand situation, show how to help, see if it makes sense)",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ],
        "red_flags": [
          "How are you today? opener (conversion killer)",
          "Launching into product pitch immediately",
          "No agenda setting",
          "Long company introduction"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on with math that made you reach out?",
          "Got it. And what grade is [Child] in? Which math course are they taking right now?",
          "What would success look like for [Child] by the end of this school year?",
          "And what made you reach out NOW versus a few months ago?"
        ],
        "required_elements": [
          "Ask why they reached out (open-ended)",
          "Get them to state their problem in their own words",
          "Cover child''s grade level and current course",
          "Ask about their goal/success criteria",
          "Uncover urgency trigger"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Grade] taking Algebra 1. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?",
        "required_elements": [
          "Restate problem using THEIR words",
          "Include grade, course, specific challenge, and goal",
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
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with math?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get fixed?"
        ],
        "active_listening_cues": [
          "That makes sense.",
          "I hear that a lot.",
          "That''s really common at this grade."
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with Eddie''s credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "eddie_intro": "So the teacher is Eddie Kang. UCLA Pure Mathematics degree. Perfect SAT math score. Nine years teaching in high schools and colleges across California. We screened over 3,000 teachers to find him - he was the one. What makes Eddie different is how he explains things. He can take something confusing and make it click. Parents tell us their kids actually start enjoying math, which I know sounds crazy.",
        "how_it_works": "[Child] joins live twice a week - Tue & Thu at 5pm Pacific / 8pm Eastern. Eddie''s teaching in real-time, kids are chatting and asking questions. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need.",
        "proof_points": {
          "engagement": "20-30 chat messages per student per lesson",
          "attitude": "83% report attitude improvement",
          "quality": "Best Online School 2025, 95% parent satisfaction",
          "price": "$149/mo vs $60-80/hr tutors ($400+/mo)"
        }
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the program works?",
        "aaa_framework": {
          "acknowledge": "Repeat their concern neutrally",
          "associate": "Connect to success story or similar situation",
          "ask": "Return with a question to move forward"
        },
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full course is $539 for the year - that''s less than $17 an hour for 60 hours of teaching from Eddie, plus all the workbooks, practice problems, and video solutions.",
        "tier_2_monthly": "Totally fair. We also have monthly at $149. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for $7 for a week. Full access to everything. If it''s not a fit, you cancel, no questions.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class on Tuesday at 5pm Pacific."
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalized learning",
        "Math can be fun!",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);

-- Geometry Script
insert into scripts (name, course, version, is_active, content) values (
  'Geometry Sales Script v2',
  'Geometry',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Geometry",
      "schedule": {
        "days": "Mon & Wed",
        "pacific_time": "6pm",
        "eastern_time": "9pm"
      }
    },
    "pricing": {
      "annual_premium": {"price": 539, "payment_plan": "3x $180", "framing": "Less than $17/hr for 60 hours"},
      "annual_essentials": {"price": 489, "payment_plan": "3x $163", "framing": "Save vs monthly"},
      "monthly_premium": {"price": 149, "framing": "No lock-in, cancel anytime"},
      "monthly_essentials": {"price": 135, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 7, "duration": "7 days", "framing": "Full access, risk-free test"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped thousands of parents get their kids confident in math, including a lot in Geometry specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Grade] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (thousands of parents)",
          "Promise outcome (understand situation, show how to help, see if it makes sense)",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on with math that made you reach out?",
          "Got it. And what grade is [Child] in? Which math course are they taking right now?",
          "What would success look like for [Child] by the end of this school year?",
          "And what made you reach out NOW versus a few months ago?"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Grade] taking Geometry. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with math?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get fixed?"
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with Eddie''s credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "eddie_intro": "So the teacher is Eddie Kang. UCLA Pure Mathematics degree. Perfect SAT math score. Nine years teaching in high schools and colleges across California. We screened over 3,000 teachers to find him - he was the one. What makes Eddie different is how he explains things. He can take something confusing and make it click. Parents tell us their kids actually start enjoying math, which I know sounds crazy.",
        "how_it_works": "[Child] joins live twice a week - Mon & Wed at 6pm Pacific / 9pm Eastern. Eddie''s teaching in real-time, kids are chatting and asking questions. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the program works?",
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full course is $539 for the year - that''s less than $17 an hour for 60 hours of teaching from Eddie, plus all the workbooks, practice problems, and video solutions.",
        "tier_2_monthly": "Totally fair. We also have monthly at $149. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for $7 for a week. Full access to everything. If it''s not a fit, you cancel, no questions.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class on Monday at 6pm Pacific."
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalized learning",
        "Math can be fun!",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);

-- Algebra 2 Script
insert into scripts (name, course, version, is_active, content) values (
  'Algebra 2 Sales Script v2',
  'Algebra 2',
  2,
  true,
  '{
    "framework": "CLOSER (Hormozi)",
    "target_duration": "8-12 minutes",
    "course_details": {
      "name": "Algebra 2",
      "schedule": {
        "days": "Tue & Thu",
        "pacific_time": "6pm",
        "eastern_time": "9pm"
      }
    },
    "pricing": {
      "annual_premium": {"price": 539, "payment_plan": "3x $180", "framing": "Less than $17/hr for 60 hours"},
      "annual_essentials": {"price": 489, "payment_plan": "3x $163", "framing": "Save vs monthly"},
      "monthly_premium": {"price": 149, "framing": "No lock-in, cancel anytime"},
      "monthly_essentials": {"price": 135, "framing": "No lock-in, cancel anytime"},
      "trial": {"price": 7, "duration": "7 days", "framing": "Full access, risk-free test"}
    },
    "closer_phases": {
      "opening": {
        "name": "Opening (Proof-Promise-Plan)",
        "duration": "30-60 sec",
        "goal": "Set agenda, build credibility, get micro-commitment",
        "exact_script": "Hi [Name], this is [Rep] from MyEdSpace. Thanks for booking time with me. Quick background: we''ve helped thousands of parents get their kids confident in math, including a lot in Algebra 2 specifically. On this call, I want to understand what''s going on with [Child], show you how we might help, and see if it makes sense. Should take about 10 minutes. How does that sound?",
        "with_setter_notes": "Hey [Name], [Setter] mentioned [Child] is in [Grade] and [specific issue from notes]. Is that still where things are at?",
        "required_elements": [
          "Greet + thank them for booking",
          "Brief proof/credibility (thousands of parents)",
          "Promise outcome (understand situation, show how to help, see if it makes sense)",
          "Plan for the call (10 minutes)",
          "Micro-commitment (How does that sound?)"
        ]
      },
      "clarify": {
        "name": "C - Clarify",
        "duration": "1-2 min",
        "goal": "Get prospect to state their problem/goal",
        "exact_script": [
          "So what''s going on with math that made you reach out?",
          "Got it. And what grade is [Child] in? Which math course are they taking right now?",
          "What would success look like for [Child] by the end of this school year?",
          "And what made you reach out NOW versus a few months ago?"
        ]
      },
      "label": {
        "name": "L - Label",
        "duration": "30 sec",
        "goal": "Name their problem back, get confirmation",
        "exact_script": "Okay, so let me make sure I''ve got this right. [Child] is in [Grade] taking Algebra 2. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that accurate?"
      },
      "overview": {
        "name": "O - Overview (Pain Cycle)",
        "duration": "2-3 min",
        "goal": "Exhaust past attempts, surface all pain",
        "importance": "THIS IS THE MOST IMPORTANT PHASE. Prospects don''t buy without pain.",
        "exact_script": [
          "Before I tell you about what we do, I want to understand what you''ve already tried. What have you done so far to help [Child] with math?",
          "Okay, and how did that go?",
          "Got it. What else have you tried?",
          "Anything else?",
          "So you''ve tried [list everything], and none of it has really stuck. Is that fair to say?",
          "How long has this been going on?",
          "And if nothing changes, what happens? Like, where does [Child] end up in 6 months if this doesn''t get fixed?"
        ]
      },
      "sell_vacation": {
        "name": "S - Sell the Vacation",
        "duration": "2-3 min",
        "goal": "Sell outcomes not features, lead with Eddie''s credentials",
        "permission_script": "Okay, that''s really helpful. Can I tell you about how we might be able to help?",
        "eddie_intro": "So the teacher is Eddie Kang. UCLA Pure Mathematics degree. Perfect SAT math score. Nine years teaching in high schools and colleges across California. We screened over 3,000 teachers to find him - he was the one. What makes Eddie different is how he explains things. He can take something confusing and make it click. Parents tell us their kids actually start enjoying math, which I know sounds crazy.",
        "how_it_works": "[Child] joins live twice a week - Tue & Thu at 6pm Pacific / 9pm Eastern. Eddie''s teaching in real-time, kids are chatting and asking questions. Plus workbooks before class, practice problems after, and video solutions for every question. Everything they need."
      },
      "explain": {
        "name": "E - Explain (AAA Objection Handling)",
        "duration": "1-2 min",
        "goal": "Handle objections: Acknowledge, Associate, Ask",
        "buy_in_check": "Based on what I''ve explained, does this sound like it would help [Child] with [their stated goal]? Any questions about how the program works?",
        "key_principle": "The person asking questions is closing. Never answer an objection directly."
      },
      "reinforce_close": {
        "name": "R - Reinforce + Close",
        "duration": "1 min",
        "goal": "Tiered close: Annual -> Monthly -> Trial",
        "critical_note": "CRITICAL: Follow the tiered close. Don''t lead with trial. Once they say yes, STOP TALKING.",
        "tier_1_annual": "So here''s what most parents do. The full course is $539 for the year - that''s less than $17 an hour for 60 hours of teaching from Eddie, plus all the workbooks, practice problems, and video solutions.",
        "tier_2_monthly": "Totally fair. We also have monthly at $149. No long-term commitment - you can cancel anytime.",
        "tier_3_trial": "Tell you what. Try it for $7 for a week. Full access to everything. If it''s not a fit, you cancel, no questions.",
        "after_yes": "Great choice. Here''s what happens next: I''ll send you the link to register. [Child] can join their first class on Tuesday at 6pm Pacific."
      }
    },
    "conviction_tonality": {
      "banned_phrases": [
        "Personalized learning",
        "Math can be fun!",
        "World-class / Best-in-class",
        "Unlock potential / Learning journey / Empower",
        "SUPER excited! / AMAZING!",
        "How are you today?"
      ]
    }
  }'::jsonb
);
