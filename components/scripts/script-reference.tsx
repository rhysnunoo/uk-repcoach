'use client';

import { useState } from 'react';

type TabType = 'flow' | 'script' | 'objections' | 'messenger' | 'reference';

export function ScriptReference() {
  const [activeTab, setActiveTab] = useState<TabType>('flow');

  const tabs = [
    { id: 'flow' as const, label: 'Call Flow', icon: FlowIcon, color: 'blue' },
    { id: 'script' as const, label: 'Full Script', icon: DocumentIcon, color: 'emerald' },
    { id: 'objections' as const, label: 'Objections', icon: ShieldIcon, color: 'purple' },
    { id: 'messenger' as const, label: 'Messenger', icon: ChatIcon, color: 'sky' },
    { id: 'reference' as const, label: 'Quick Ref', icon: BookIcon, color: 'amber' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Scripts</h1>
            <p className="text-sm text-gray-500">CLOSER Framework Reference</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Pill Style */}
      <div className="bg-gray-100 p-1.5 rounded-xl inline-flex gap-1 mb-6 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'flow' && <CallFlowTab />}
        {activeTab === 'script' && <FullScriptTab />}
        {activeTab === 'objections' && <ObjectionsTab />}
        {activeTab === 'messenger' && <MessengerTab />}
        {activeTab === 'reference' && <QuickReferenceTab />}
      </div>
    </div>
  );
}

// ============================================
// CALL FLOW TAB - Visual Diagram
// ============================================

function CallFlowTab() {
  return (
    <div className="space-y-6">
      {/* Visual Call Flow */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Call Flow Diagram</h2>
          <p className="text-sm text-gray-500">Visual guide for call progression</p>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="flex flex-col gap-3">
              <FlowStep
                letter="O"
                name="OPEN"
                duration="30-60s"
                color="blue"
                items={['Greeting', 'Recording disclosure', 'Proof-Promise-Plan', '"How does that sound?"']}
              />
              <FlowConnector />
              <FlowStep
                letter="Q"
                name="QUALIFY"
                duration="1-2min"
                color="indigo"
                items={['Get child name', 'Check for siblings', 'Confirm year group', 'Confirm subjects']}
              />
              <FlowConnector />

              {/* Decision Point */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-6 py-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-amber-800">Year 5-13?</span>
                  </div>
                  <div className="flex justify-center gap-6 text-sm">
                    <span className="flex items-center gap-1.5 text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>{"YES -> Continue to subjects"}
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-700">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>{"NO -> Below Year 5 (not available)"}
                    </span>
                  </div>
                </div>
              </div>

              <FlowConnector />
              <FlowStep
                letter="Z"
                name="KILL ZOMBIES"
                duration="30s"
                color="red"
                items={['"Are you the decision-maker?"', 'Handle spouse/child upfront', 'Plant 14-day guarantee']}
                critical
              />
              <FlowConnector />

              {/* CLOSER Framework */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold text-gray-400 tracking-wider">CLOSER FRAMEWORK</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  <CloserPhase letter="C" name="Clarify" desc="What's going on?" gradient="from-emerald-500 to-emerald-600" />
                  <CloserPhase letter="L" name="Label" desc="Confirm problem" gradient="from-teal-500 to-teal-600" />
                  <CloserPhase letter="O" name="Overview" desc="Pain Cycle" gradient="from-amber-500 to-amber-600" critical />
                  <CloserPhase letter="S" name="Sell" desc="Teachers + Benefits" gradient="from-blue-500 to-blue-600" />
                  <CloserPhase letter="E" name="Explain" desc="Handle objections" gradient="from-purple-500 to-purple-600" />
                  <CloserPhase letter="R" name="Reinforce" desc="Close the deal" gradient="from-green-500 to-green-600" />
                </div>
              </div>

              <FlowConnector />

              {/* Close Tiers */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    TIERED CLOSE
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <PriceTier tier={1} price="£319+" label="Annual" sublabel="Default - Lead with this" primary />
                  <PriceTier tier={2} price="£80+/mo" label="Monthly" sublabel="Downsell option" />
                  <PriceTier tier={3} price="£10" label="10-Day Trial" sublabel="Last resort only" muted />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cheat Sheet */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <h3 className="font-semibold text-white">Quick Cheat Sheet</h3>
          <p className="text-sm text-slate-300">Reference during calls</p>
        </div>
        <div className="divide-y divide-gray-100">
          <CheatRow phase="OPEN" color="blue" text={'Greeting -> Recording -> Proof-Promise-Plan -> "How does that sound?"'} />
          <CheatRow phase="QUALIFY" color="indigo" text={"Get child's name -> Check siblings -> Confirm year group -> Confirm subjects"} />
          <CheatRow phase="ZOMBIES" color="red" text={'"Are you the decision-maker?" -> Handle spouse/child -> Plant guarantee'} critical />
          <CheatRow phase="C" color="emerald" text={'"What\'s been going on?" -> "What would success look like?" -> "Why now?"'} />
          <CheatRow phase="L" color="teal" text={'"So it sounds like [problem] and you want [goal]. Is that accurate?"'} />
          <CheatRow phase="O" color="amber" text={'"What have you tried?" -> "How did that go?" -> "What else?" -> Exhaust all'} critical />
          <CheatRow phase="S" color="blue" text={"Teacher credentials (top 1%) -> Bridge from pain -> How it works -> 14-day guarantee"} />
          <CheatRow phase="E" color="purple" text={"AAA: Acknowledge -> Associate -> Ask. Expect 2-4 objections."} />
          <CheatRow phase="R" color="green" text={"Annual → Monthly → Trial (last resort) → Stay on line for payment"} />
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Class Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Subject</th>
                <th className="px-6 py-3">Year Groups</th>
                <th className="px-6 py-3">Days</th>
                <th className="px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <ScheduleRow course="KS3 Maths" days="Year 7-9" pacific="Mon & Wed" eastern="5:00pm" />
              <ScheduleRow course="GCSE Maths" days="Year 10-11" pacific="Tue & Thu" eastern="5:30pm" />
              <ScheduleRow course="A-Level Maths" days="Year 12-13" pacific="Mon & Wed" eastern="6:00pm" />
              <ScheduleRow course="GCSE Science" days="Year 10-11" pacific="Tue & Thu" eastern="6:30pm" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FlowStep({ letter, name, duration, color, items, critical = false }: {
  letter: string;
  name: string;
  duration: string;
  color: string;
  items: string[];
  critical?: boolean;
}) {
  const colors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', text: 'text-blue-900' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-600', text: 'text-indigo-900' },
    red: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-600', text: 'text-red-900' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 ${critical ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`${c.badge} w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm`}>
          {letter}
        </span>
        <div>
          <span className={`font-bold ${c.text}`}>{name}</span>
          <span className="text-gray-500 text-sm ml-2">({duration})</span>
        </div>
        {critical && (
          <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">CRITICAL</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 ml-12">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center text-sm">
            {idx > 0 && <span className="text-gray-400 mx-1">{"->"}</span>}
            <span className="bg-white/80 px-2.5 py-1 rounded-md border border-gray-200/50 text-gray-700">{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-gray-200 rounded-full"></div>
    </div>
  );
}

function CloserPhase({ letter, name, desc, gradient, critical = false }: {
  letter: string;
  name: string;
  desc: string;
  gradient: string;
  critical?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg p-2.5 text-center border ${critical ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-200'} shadow-sm`}>
      <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-sm shadow-sm`}>
        {letter}
      </div>
      <p className="font-semibold text-gray-900 text-xs mt-1.5">{name}</p>
      <p className="text-[10px] text-gray-500 leading-tight">{desc}</p>
      {critical && <span className="text-[9px] text-amber-600 font-bold">CRITICAL</span>}
    </div>
  );
}

function PriceTier({ tier, price, label, sublabel, primary = false, muted = false }: {
  tier: number;
  price: string;
  label: string;
  sublabel: string;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 text-center transition-all ${
      primary ? 'bg-white border-2 border-green-400 shadow-md' :
      muted ? 'bg-gray-50 border border-gray-200' :
      'bg-white border border-gray-200'
    }`}>
      <div className={`text-xs font-bold mb-1 ${primary ? 'text-green-600' : 'text-gray-400'}`}>TIER {tier}</div>
      <div className={`text-2xl font-bold ${muted ? 'text-gray-500' : 'text-gray-900'}`}>{price}</div>
      <div className={`text-sm font-medium ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{label}</div>
      <div className="text-xs text-gray-400 mt-1">{sublabel}</div>
    </div>
  );
}

function CheatRow({ phase, color, text, critical = false }: {
  phase: string;
  color: string;
  text: string;
  critical?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', indigo: 'text-indigo-600', red: 'text-red-600',
    emerald: 'text-emerald-600', teal: 'text-teal-600', amber: 'text-amber-600',
    purple: 'text-purple-600', green: 'text-green-600',
  };

  return (
    <div className={`flex items-start gap-4 px-6 py-3 ${critical ? 'bg-amber-50' : 'hover:bg-gray-50'} transition-colors`}>
      <span className={`font-bold text-sm w-20 flex-shrink-0 ${colors[color] || 'text-gray-600'}`}>{phase}</span>
      <span className="text-sm text-gray-700">{text}</span>
      {critical && <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded">KEY</span>}
    </div>
  );
}

function ScheduleRow({ course, days, pacific, eastern }: {
  course: string;
  days: string;
  pacific: string;
  eastern: string;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 font-medium text-gray-900">{course}</td>
      <td className="px-6 py-4 text-gray-600">{days}</td>
      <td className="px-6 py-4 text-gray-600">{pacific}</td>
      <td className="px-6 py-4 text-gray-600">{eastern}</td>
    </tr>
  );
}

// ============================================
// FULL SCRIPT TAB
// ============================================

function FullScriptTab() {
  return (
    <div className="space-y-6">
      {/* Tonality Guide */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg">Tonality Guide</h3>
            <p className="text-blue-100 text-sm">Words = 10%. Tonality = 90%.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { title: 'Statements ↓', desc: 'Downward inflection = certainty' },
            { title: 'Questions ↑', desc: 'Upward inflection = invites response' },
            { title: 'Slow on proof', desc: 'Top 1%... combined 100+ years... Let it land' },
            { title: 'Pause after key info', desc: 'Silence = confidence' },
            { title: 'Match their energy', desc: 'Calm if calm, acknowledge stress' },
            { title: 'Use their names', desc: 'Parent and child throughout' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-3">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-blue-100 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <ScriptSection phase="OPENING" duration="30-60 sec" color="blue"
        goal={"Set agenda fast. Control the conversation. NO 'how are you today?'"}>
        <ScriptLine>{`"Hi there - am I speaking with [Parent]? Thanks so much for booking in a consultation with me."`}</ScriptLine>
        <ScriptNote>{"Recording Disclosure (Required):"}</ScriptNote>
        <ScriptLine>{`"Just to let you know, this call is recorded for training purposes. Is that okay?"`}</ScriptLine>
        <ScriptNote>{"[Wait for confirmation]"}</ScriptNote>
        <ScriptLine>{`"Brilliant. So just a quick background - we've helped over 21,000 students across the UK improve their grades and confidence. On this call, I'd love to understand what's going on with your child, show you how we might be able to help, and see if it's a good fit. Should only take about 10 minutes. How does that sound?"`}</ScriptLine>
        <ScriptTip>{`Get a micro-commitment ('sounds good') before proceeding.`}</ScriptTip>
      </ScriptSection>

      <ScriptSection phase="C - CLARIFY" duration="1-2 min" color="emerald"
        goal="Get THEM to state the problem. The person asking questions is closing.">
        <ScriptNote>{`Get child's name if you don't have it:`}</ScriptNote>
        <ScriptLine>{`"So first things first - who's the lucky one we're helping today? What's your child's name?"`}</ScriptLine>
        <ScriptNote>{"Check for siblings:"}</ScriptNote>
        <ScriptLine>{`"And do you have any other children who might benefit from some support too?"`}</ScriptLine>
        <ScriptTip>{`If YES: "We have a 20% sibling discount on the less expensive package."`}</ScriptTip>
        <ScriptNote>{"Confirm year group/subjects:"}</ScriptNote>
        <ScriptLine>{`"What year is [Child] in?"`}</ScriptLine>
        <ScriptLine>{`"For [Year Group], we offer [Subjects]. Which of these - if not all - are you interested in for [Child]?"`}</ScriptLine>
        <QualificationBox />
      </ScriptSection>

      <ScriptSection phase="KILL ZOMBIES" duration="30 sec" color="red" critical
        goal="Handle spouse/partner/kid objection BEFORE you pitch">
        <ScriptLine>{`"Before I tell you more, quick question: are you the one who makes decisions about [Child]'s education, or is there someone else - spouse, partner - who'd need to be involved as well?"`}</ScriptLine>
        <ScriptNote>{`If "just me":`}</ScriptNote>
        <ScriptLine>{`"Perfect. And is [Child] on board with getting some help, or is this a surprise?"`}</ScriptLine>
        <ScriptNote>{`If "need to talk to spouse":`}</ScriptNote>
        <ScriptLine>{`"Makes sense. Are they around now, or is there a time today we could get them on the call too?"`}</ScriptLine>
        <ScriptLine>{`"No problem. Let's do this - I'll walk you through everything. We also have a 14-day money-back guarantee, so even if you sign up today, your partner can see it in action and you can get a full refund if it's not right. Sound good?"`}</ScriptLine>
      </ScriptSection>

      <ScriptSection phase="CORE DISCOVERY" duration="1-2 min" color="teal"
        goal="Understand their situation">
        <ScriptLine>{`"So tell me, what's been going on with [Child]'s education that made you reach out to us?"`}</ScriptLine>
        <ScriptNote>{"[Let them talk. Take notes. Use their words later.]"}</ScriptNote>
        <ScriptLine>{`"What would success look like for [Child] by the end of this school year?"`}</ScriptLine>
        <ScriptLine>{`"And what made you reach out NOW versus a few months ago?"`}</ScriptLine>
        <ScriptTip>{"This reveals urgency - recent bad grade? Upcoming test?"}</ScriptTip>
      </ScriptSection>

      <ScriptSection phase="L - LABEL" duration="30 sec" color="teal"
        goal="Name their problem back to them. They must hear it and agree.">
        <ScriptLine>{`"Okay, so let me make sure I've got this right. [Child] is in [Year] taking [Subjects]. The main challenge is [their specific pain - use their words]. And what you really want is [their stated goal]. Is that right?"`}</ScriptLine>
        <ScriptNote>{"[Wait for confirmation]"}</ScriptNote>
        <ScriptLine>{`"Got it. That's really helpful."`}</ScriptLine>
      </ScriptSection>

      <ScriptSection phase="O - OVERVIEW (Pain Cycle)" duration="2-3 min" color="amber" critical
        goal="Exhaust all prior attempts. Prospects don't buy without pain.">
        <ScriptLine>{`"Before reaching out to us, what have you tried so far to help [Child]?"`}</ScriptLine>
        <ScriptNote>{"[Common: private tutors, YouTube, BBC Bitesize, Kumon, school support, nothing yet]"}</ScriptNote>
        <ScriptLine>{`"Okay, and how did that go?"`}</ScriptLine>
        <ScriptLine>{`"Got it. What else have you tried?"`}</ScriptLine>
        <ScriptNote>{`[Keep asking "what else?" until exhausted]`}</ScriptNote>
        <ScriptLine>{`"So you've tried [list everything], and none of it has really stuck. Is that fair to say?"`}</ScriptLine>
        <ScriptLine>{`"How long has this been going on?"`}</ScriptLine>
        <ScriptLine>{`"And if things stay the way they are - what does that mean for [Child] by exam time?"`}</ScriptLine>
        <ScriptTip>{"This makes the stakes real. Let them verbalise consequences."}</ScriptTip>
      </ScriptSection>

      <ScriptSection phase="S - SELL THE VACATION" duration="2-3 min" color="blue"
        goal="Sell the outcome. Lead with teacher credentials.">
        <ScriptLine>{`"That's really helpful, thank you. Can I tell you a bit about how we might be able to help?"`}</ScriptLine>
        <ScriptNote>{"TEACHER INTRO (Lead with credentials):"}</ScriptNote>
        <ScriptLine>{`"Let me tell you about who'll be teaching [Child]. Our teachers are in the top 1% in the country - combined 100+ years of teaching experience. What students say makes them special is how they explain topics. They can take something confusing and just make it click."`}</ScriptLine>
        <ScriptNote>{`WHAT [CHILD]'S WEEK LOOKS LIKE:`}</ScriptNote>
        <ScriptLine>{`"[Child] gets 2 live lessons every week per subject. They follow along with a workbook we provide, so they can focus on listening instead of frantically copying notes. The teacher teaches live - it's interactive, not passive. Students ask questions in chat, work through problems together. On average, each student sends around 25 messages per lesson."`}</ScriptLine>
        <ScriptLine>{`"And it doesn't stop when the lesson ends. Every week, there are practice problems that reinforce what was taught. And here's the key part - every single problem has a video solution where the teacher walks through it step by step. So if [Child] gets stuck at 9pm doing homework? They're not actually stuck."`}</ScriptLine>
        <ScriptLine>{`"Every lesson is recorded and available instantly. So if [Child] misses a class - football, family dinner, whatever - they just watch the recording. They don't fall behind."`}</ScriptLine>
        <ScriptNote>{"PLANT THE GUARANTEE:"}</ScriptNote>
        <ScriptLine>{`"And we have a 14-day money-back guarantee. If it's not working, full refund, no hassle."`}</ScriptLine>
        <ScriptLine>{`"How does all of that sound so far?"`}</ScriptLine>
      </ScriptSection>

      <ScriptSection phase="R - REINFORCE + CLOSE" duration="1-2 min" color="green"
        goal="Follow the tiered close. Don't lead with trial. STOP when they say yes.">
        <ScriptNote>{"TIER 1: Annual Close (Default)"}</ScriptNote>
        <ScriptLine>{`"So let me walk you through the investment. An average private tutor charges around £50 an hour. Two lessons a week per subject - that adds up quickly."`}</ScriptLine>
        <ScriptLine>{`"With us, you get our top 1% teachers for just £319 for 1 subject for the full year. That works out to around £4.31 per lesson. You can pay upfront and save an extra 5%, or split it into 3 monthly instalments."`}</ScriptLine>
        <ScriptLine>{`"And remember - 14-day money-back guarantee."`}</ScriptLine>
        <ScriptLine>{`"The next class for [Child] is [Day]. Should I get [Child] set up so they can start this week?"`}</ScriptLine>
        <div className="my-4 p-4 bg-green-100 border border-green-300 rounded-xl">
          <p className="font-bold text-green-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {"If they say YES -> STOP. Stay on line for payment."}
          </p>
        </div>
        <ScriptNote>{"AFTER YES:"}</ScriptNote>
        <ScriptLine>{`"Great choice. I'm sending you the registration link now. I'm happy to stay on the line while you register - it should only take 1 or 2 minutes."`}</ScriptLine>
        <ScriptNote>{"TIER 2: Monthly Downsell (If price objection)"}</ScriptNote>
        <ScriptLine>{`"Or if you'd prefer flexibility, we have monthly at £80 per subject. No lock-in, cancel anytime. Same 14-day guarantee."`}</ScriptLine>
        <ScriptNote>{"TIER 3: Trial Save (Last resort)"}</ScriptNote>
        <ScriptLine>{`"Tell you what - try it for 10 days, just £10. Full access. No auto-renewal. If it's not a fit, no harm done. But if [Child] loves it, you're set. Fair?"`}</ScriptLine>
      </ScriptSection>

      <ScriptSection phase="MULTI-SUBJECT PRICING" duration="For 2+ subjects" color="purple"
        goal="Upsell for families needing multiple subjects">
        <ScriptLine>{`"Since [Child] needs help with [Subject 1] and [Subject 2], let me tell you about our multi-subject options."`}</ScriptLine>
        <ScriptLine>{`"For 2 subjects, it's £574.20 for the year - that's a 10% discount compared to buying them separately."`}</ScriptLine>
        <ScriptLine>{`"Or for our Ultimate package - 3 or more subjects - it's £789 for the full year. That's the best value by far."`}</ScriptLine>
        <ScriptTip>{`If they have a sibling: "And we offer 20% off the less expensive package for siblings."`}</ScriptTip>
      </ScriptSection>
    </div>
  );
}

function ScriptSection({ phase, duration, goal, color, critical = false, children }: {
  phase: string;
  duration: string;
  goal: string;
  color: string;
  critical?: boolean;
  children: React.ReactNode;
}) {
  const colors: Record<string, { border: string; bg: string; badge: string }> = {
    blue: { border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-600' },
    emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', badge: 'bg-emerald-600' },
    teal: { border: 'border-teal-200', bg: 'bg-teal-50', badge: 'bg-teal-600' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50', badge: 'bg-amber-600' },
    red: { border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-600' },
    green: { border: 'border-green-200', bg: 'bg-green-50', badge: 'bg-green-600' },
    purple: { border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-600' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`bg-white rounded-2xl border ${c.border} shadow-sm overflow-hidden ${critical ? 'ring-2 ring-red-200' : ''}`}>
      <div className={`${c.bg} px-6 py-4 border-b ${c.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`${c.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>{phase}</span>
            <span className="text-gray-500 text-sm">{duration}</span>
          </div>
          {critical && <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">CRITICAL</span>}
        </div>
        <p className="text-sm font-medium text-gray-700 mt-2">{goal}</p>
      </div>
      <div className="p-6 space-y-3">
        {children}
      </div>
    </div>
  );
}

function ScriptLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border-l-4 border-primary">
      <span className="text-gray-800">{children}</span>
    </div>
  );
}

function ScriptNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 italic pl-4">{children}</p>;
}

function ScriptTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-50 text-blue-800 p-3 rounded-xl text-sm">
      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {children}
    </div>
  );
}

function QualificationBox() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 my-3">
      <p className="font-bold text-amber-800 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Qualification Check
      </p>
      <div className="space-y-1.5 text-sm">
        <p className="flex items-center gap-2 text-green-700"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{"Year 5-13 / All subjects -> Continue"}</p>
        <p className="flex items-center gap-2 text-blue-700"><span className="w-2 h-2 bg-blue-500 rounded-full"></span>{"Below Year 5 -> Not currently available"}</p>
        <p className="flex items-center gap-2 text-gray-500"><span className="w-2 h-2 bg-gray-400 rounded-full"></span>{"Graduate -> Check siblings / Alumni referral"}</p>
      </div>
    </div>
  );
}

// ============================================
// OBJECTIONS TAB
// ============================================

function ObjectionsTab() {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="space-y-6">
      {/* AAA Framework */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          AAA Framework
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">1</div>
            <p className="font-bold">Acknowledge</p>
            <p className="text-purple-100 text-sm mt-1">{`"Totally understand..."`}</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">2</div>
            <p className="font-bold">Associate</p>
            <p className="text-purple-100 text-sm mt-1">Connect / Reframe / Proof</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">3</div>
            <p className="font-bold">Ask</p>
            <p className="text-purple-100 text-sm mt-1">Question to move forward</p>
          </div>
        </div>
        <p className="text-purple-100 text-sm mt-4 text-center">{`Expect 2-4 objections. When they switch objections, you're making progress.`}</p>
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-sm text-primary hover:text-primary-600 font-medium flex items-center gap-1.5"
        >
          {expandAll ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse All
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand All
            </>
          )}
        </button>
      </div>

      {/* Objection Cards */}
      <div className="space-y-3">
        <ObjectionCard objection="It's too expensive / That's more than I wanted to spend" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Totally understand - you want to make sure it's worth it."

**ASSOCIATE (Question first):**
"Quick question: what are you comparing us to?"

[Wait for answer - this tells you what frame to use]

**If they mention PRIVATE TUTORING:**
"Right, so private tutors run £40-60 an hour. That's like £150-200+ a month, and that's just for one session a week. We're £80/month per subject for 2 live lessons per week with top 1% teachers - combined 100+ years experience. Plus workbooks, video solutions for every problem. Way more support for less money."

**If they mention KUMON / MATHNASIUM:**
"Kumon is typically £60-80/month per subject, and that's just worksheets with a supervisor - no actual teaching. With us, top 1% teachers TEACH live every lesson. Same elite teachers every week. £80/month per subject, from home."

**If they mention FREE OPTIONS (YouTube, Khan):**
"Totally - BBC Bitesize and YouTube are great for revision snippets. The challenge is, there's no structure, no accountability, and when your child gets stuck, they're stuck. With us, top 1% teachers teach live - students interact in real-time with 25 messages per lesson on average. Every practice problem has a video solution. That's the difference between free and effective."

**ASK (Close):**
"And remember - we have a 14-day money-back guarantee. Full month to see if it's worth it. If not, full refund. Does that change how it feels?"

**DOWNSELL if still hesitant:**
"We also have monthly at £80 per subject with no commitment - cancel anytime. Same 14-day guarantee. Want to start there?"`} />

        <ObjectionCard objection="I need to talk to my spouse / partner" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Makes total sense. Big decisions together."

**ASSOCIATE (Dig deeper):**
"What questions do you think they'll have?"

[Listen and address each concern. Then:]

"Here's what I'd suggest: Let's get [Child] signed up today so they don't miss any more classes. You've got a 14-day money-back guarantee, so your spouse can see it in action - watch a class with [Child], see the workbooks, see the teaching in action."

"If either of you decides it's not right, full refund, no questions asked. But this way [Child] doesn't fall further behind while you're deciding."

**ASK:**
"Sound fair?"

**ALTERNATIVE if they push back:**
"Okay, I hear you. Are they around now? We could get them on the call for a few minutes."

**If not available:**
"When would be a good time for a call with both of you? I'd hate for [Child] to miss more classes just because of scheduling."`} />

        <ObjectionCard objection="I need to think about it / Let me sleep on it" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Totally get it - it's a decision."

**ASSOCIATE (Challenge gently):**
"What's your main concern? What are you afraid of happening?"

[If they give a specific concern - address it]

[If they're vague or say "just want to think":]
"Here's the thing - you're not going to go home and stare at the wall thinking about math class. You'll get busy, life happens, a week goes by, [Child] has another rough homework night, another test doesn't go well."

"What information do you still need to decide? Because I'm your information source right now. Ask me anything."

[Pause - let them talk]

**ASK:**
"Here's what I know: you called us because something isn't working. Every day you wait is another day [Child] falls further behind. And you've got a 14-day money-back guarantee - so you can start today and STILL think about it for two weeks."

"What's holding you back?"`} />

        <ObjectionCard objection="My child won't engage / won't stick with it" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"I hear that a lot - and it's usually from parents whose kids have tried those boring recorded video platforms. Totally different."

**ASSOCIATE:**
"This is LIVE. Our teachers are there, teaching in real-time. Kids are chatting, asking questions, answering problems. It's interactive."

"Here's a stat: we see 25 chat messages per student per lesson. That's not kids zoning out - that's kids engaged."

"And Our teachers' style is different. Parents tell us their kids who hate the subject actually start looking forward to class. They make it click in a way school teachers can't."

**ASK:**
"Plus - 14-day money-back guarantee. If [Child] genuinely doesn't engage, full refund. But I'd bet they surprise you."

"Let's get them started - what do you have to lose?"`} />

        <ObjectionCard objection="The class times don't work for us" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Totally understand - schedules are tight."

**ASSOCIATE:**
"Here's the good news: every single lesson is recorded and available immediately after class. So if [Child] has football on Monday, they watch the recording that night or next morning."

"A lot of our students do a mix - live when they can, recording when they can't. Works great either way."

"The workbooks are the same. Practice problems are the same. Video solutions for every question. Whether live or recorded, [Child] gets the same quality instruction."

"Plus every practice problem has a video solution so they can learn at their own pace between classes."

**ASK:**
"What days is [Child] free? Let me check if our schedule could work even partially live."`} />

        <ObjectionCard objection="I want 1-on-1 tutoring / private attention" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"I get it - 1-on-1 feels like it should be better."

**ASSOCIATE:**
"Here's what we've learned: with a random tutor at £40-60 an hour, you're paying for someone to help with tonight's homework. They're not building real understanding."

"With us, you get top 1% teachers with combined 100+ years experience. Some are actual exam markers. They teach a structured curriculum where each concept builds on the last. That's how kids actually learn, not one-off homework help."

"And here's what's interesting - in our classes, kids actually interact MORE than with a private tutor. We see 25 chat messages per student per lesson. They're asking questions, answering problems, engaged the whole time."

"Plus between classes, [Child] has video solutions for every single practice problem - so they're never stuck."

**ASK:**
"And at £80/month versus £200+/month for weekly tutoring, you get way more for way less. 14-day guarantee - try it and see?"`} />

        <ObjectionCard objection="We're considering Kumon / another tutoring service" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Both solid options. Let me share the key differences."

**ASSOCIATE (for Kumon):**
"Kumon is worksheet-based. Kids sit there doing repetitive problems with a proctor watching. It builds some skills, but there's no actual teaching."

"With us, top 1% teachers TEACH live. They explain concepts, break things down, make it click. Then practice with video solutions for every problem."

**(for other tutoring services):**
"Private tutoring centres are pricey - usually £200+/month. And you're getting rotating tutors - different person each visit."

"With us, the same elite teachers teach every lesson. Top 1% nationally, combined 100+ years experience. £80/month per subject, from home."

**ASK:**
"Tell you what - try our £10 trial for 10 days before you commit to anything. See the teachers in action, see if it clicks for [Child]. Then decide. Fair?"`} />

        <ObjectionCard objection="We already use IXL / Khan Academy" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"IXL is great for practice - lots of problems, adaptive."

**ASSOCIATE:**
"The challenge is, it's software, not teaching. When [Child] gets stuck on a concept, they're stuck. They can watch a hint video, but that's not the same as someone explaining it properly."

"We're the opposite. Our teachers actually TEACH the concept first. Then practice problems. And every single problem has a video solution where the teacher walks through it step by step."

"IXL is like a gym with no trainer. We're the trainer."

"Plus video solutions for every practice problem - [Child] is never stuck without help."

**ASK:**
"You can keep using IXL for extra practice. Add us for the actual teaching. 14-day guarantee to see if it makes a difference?"`} />

        <ObjectionCard objection="What if it doesn't work? / Can you guarantee results?" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Totally fair question - you've probably tried things that didn't work before."

**ASSOCIATE:**
"Here's what I can guarantee: 14 days, full money back, no questions asked. That's two weeks to see if the teaching style clicks for [Child]."

"We have a 95% parent satisfaction rate and 1,700+ five-star Trustpilot reviews. 58% of our GCSE students achieved grades 7-9 - double the national average. Those are real numbers from real families."

"But I can't guarantee YOUR specific kid's grades, because that depends on them doing the work. What I CAN guarantee is that if you give this a real shot and it's not working, you get every penny back."

**ASK:**
"What would you need to see in the first month to feel like it's working?"`} />

        <ObjectionCard objection="My child needs to focus on school, not extra programs" forceOpen={expandAll} response={`**ACKNOWLEDGE:**
"Makes sense - you don't want to overload them."

**ASSOCIATE:**
"Here's the thing: this isn't extra work on top of school. This IS the school math - the same syllabus their school follows - Maths, English, Science. Same concepts, taught better by top 1% teachers."

"Most parents tell us homework actually gets EASIER after a few weeks with us. Kids understand the concepts, so they're not struggling for hours."

"Two hours a week with us could save [Child] hours of frustrated homework time."

**ASK:**
"What if I told you this could actually reduce their stress, not add to it? 14-day guarantee to prove it."`} />
      </div>

      {/* All-Purpose Closes */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          All-Purpose Closes
        </h3>
        <div className="grid gap-3">
          {[
            { name: 'Main Concern', script: '"What\'s your main concern? What are you afraid of happening?"', tip: 'Gets to the real objection' },
            { name: 'Best/Worst', script: '"Best case: confident kid. Worst case: 14-day refund. Which risk makes sense?"', tip: 'Reframes the risk' },
            { name: 'Reason', script: '"The reason you\'re telling yourself not to is exactly why you should."', tip: 'Pattern interrupt - use sparingly' },
            { name: 'What Would Make It', script: '"What would make this a yes for you?"', tip: 'They tell you what to close on' },
            { name: 'Information Source', script: '"What info do you still need? I\'m your information source right now."', tip: 'Prevents "I\'ll research more"' },
          ].map((close, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-green-700">{close.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{close.tip}</span>
              </div>
              <p className="text-gray-700 italic">{close.script}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ObjectionCard({ objection, response, forceOpen = false }: { objection: string; response: string; forceOpen?: boolean }) {
  // Convert markdown-style bold to actual styling
  const formatResponse = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="font-bold text-purple-700 mt-4 first:mt-0">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('[') && line.endsWith(']')) {
        return <p key={idx} className="text-gray-500 italic text-sm">{line}</p>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-gray-700">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <details className="bg-white rounded-xl border border-gray-200 shadow-sm group overflow-hidden" open={forceOpen}>
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
        <span className="font-medium text-gray-900 pr-4">{`"${objection}"`}</span>
        <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
        <div className="text-sm space-y-1 leading-relaxed">
          {formatResponse(response)}
        </div>
      </div>
    </details>
  );
}

// ============================================
// MESSENGER TAB
// ============================================

function MessengerTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold">Messenger Scripts</h3>
            <p className="text-sky-100 text-sm">{"Qualify year group first -> Trial signup or call within 4-6 messages"}</p>
          </div>
        </div>
      </div>

      {/* Live Course Flow */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-900">Live Course Flow</h3>
          <p className="text-sm text-gray-500">Year 5-13 / All subjects</p>
        </div>
        <div className="p-6 space-y-4">
          <MessageBubble num={1} label="Opening" color="blue">
            {`Hey [Name], this is [Rep] from MyEdSpace. You reached out about help for your child - what's their name?`}
          </MessageBubble>
          <MessageBubble num={2} label="Year Group" color="blue">
            Great! What year is [Child] in, and which subjects are they struggling with?
          </MessageBubble>
          <MessageBubble num={3} label="Pain" color="blue">
            Got it, [Year] in [Subject]. Is [Child] struggling right now, or looking to get ahead?
          </MessageBubble>
          <MessageBubble num={4} label="Teachers" color="blue">
            {`Here's what we do: Our teachers are in the top 1% nationally with combined 100+ years experience. Some are actual exam markers. They teach live twice a week per subject.`}
          </MessageBubble>
          <MessageBubble num={5} label="Benefits" color="blue">
            [Child] gets: 2 live lessons per week per subject, workbooks, practice problems with video solutions for every question, and recorded lessons if they miss class.
          </MessageBubble>
          <MessageBubble num={6} label="Close" color="green">
            {`A private tutor costs £40-60/hr. The full course is £319/year for 1 subject (£4.31/lesson!) or £80/month with no lock-in. 14-day money-back guarantee. Want me to send the link to get [Child] started?`}
          </MessageBubble>
        </div>
      </div>

      {/* AI Coach Flow */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <h3 className="font-semibold text-gray-900">Below Year 5 Flow</h3>
          <p className="text-sm text-gray-500">Not currently available</p>
        </div>
        <div className="p-6 space-y-4">
          <MessageBubble num={3} label="Redirect" color="purple">
            {`Got it! Our live courses currently start from Year 5 upwards. Unfortunately we don't have courses for [Child]'s year group yet.`}
          </MessageBubble>
          <MessageBubble num={4} label="Siblings" color="purple">
            Do you have any older children who might benefit? We cover Year 5 through to Year 13, with subjects including Maths, English, Science, and more.
          </MessageBubble>
          <MessageBubble num={5} label="Future" color="purple">
            We&apos;re always expanding. If you&apos;d like, I can make a note to reach out when we launch courses for [Child]&apos;s year group.
          </MessageBubble>
        </div>
      </div>

      {/* Quick Objections */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Quick Objection Responses</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { obj: 'Too expensive', resp: 'Tutoring runs £40-60/hr. This is £80/month for top 1% teachers. Works out to £4-5 per lesson. Plus 14-day money-back guarantee.' },
            { obj: 'Need to think', resp: "What's the main thing you're weighing? 14-day guarantee means you can start now and still decide." },
            { obj: 'Need to talk to spouse', resp: '14-day guarantee means you can sign up now, let your spouse see it, and get full refund if either says no.' },
            { obj: "Times don't work", resp: 'Every lesson is recorded. Mix of live + recordings works great. 14-day guarantee to test the schedule.' },
          ].map((item, idx) => (
            <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">{item.obj}:</span>
              <span className="text-gray-600 ml-2">{item.resp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Messages */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recovery Messages (No Response)</h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <span className="text-yellow-800 font-medium">After 2-4 hours:</span>
            <p className="text-yellow-700 mt-1">Hey [Name], just checking in. Any questions I can answer?</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <span className="text-orange-800 font-medium">After 24 hours:</span>
            <p className="text-orange-700 mt-1">Hi [Name], wanted to follow up. 14-day money-back guarantee means zero risk. Let me know if I can help.</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <span className="text-red-800 font-medium">After 48+ hours:</span>
            <p className="text-red-700 mt-1">Last check-in from me. If you want to try later, just reply. Good luck!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ num, label, color, children }: { num: number; label: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
  };

  return (
    <div className="flex gap-4">
      <div className={`w-10 h-10 ${colors[color] || 'bg-blue-600'} text-white rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}>
        {num}
      </div>
      <div className="flex-1">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="mt-1 bg-gray-100 rounded-2xl rounded-tl-sm p-4">
          <p className="text-gray-800">{children}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUICK REFERENCE TAB
// ============================================

function QuickReferenceTab() {
  return (
    <div className="space-y-6">
      {/* Teacher Credentials */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Teacher Credentials (Memorise)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { icon: '🎓', text: 'Top 1% teachers nationally' },
            { icon: '📊', text: 'Combined 100+ years experience' },
            { icon: '📚', text: 'Multiple exam markers on staff' },
            { icon: '🔍', text: '1,700+ five-star Trustpilot reviews' },
            { icon: '👥', text: '21,000+ students across UK' },
            { icon: '⭐', text: '58% GCSE students got 7-9' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Pricing Reference</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Package</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Framing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-green-50">
                <td className="px-6 py-4 font-semibold text-green-700">1 Subject Annual</td>
                <td className="px-6 py-4 font-bold">£319 <span className="font-normal text-gray-500">(or 3x £106.33)</span></td>
                <td className="px-6 py-4 text-gray-600">£4.31/lesson vs £50 for a tutor</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Monthly</td>
                <td className="px-6 py-4 font-bold">£80/subject/mo</td>
                <td className="px-6 py-4 text-gray-600">No lock-in, cancel anytime, 14-day guarantee</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-500">10-Day Trial</td>
                <td className="px-6 py-4 font-bold text-gray-500">£10</td>
                <td className="px-6 py-4 text-gray-500">LAST RESORT - full access, no auto-renewal</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Sibling</td>
                <td className="px-6 py-4 font-bold">20% off</td>
                <td className="px-6 py-4 text-gray-600">20% off less expensive package</td>
              </tr>
              <tr className="bg-purple-50">
                <td className="px-6 py-4 font-medium text-purple-700">Multi-Subject</td>
                <td className="px-6 py-4 font-bold">£574.20 (2) / £789 (3+)</td>
                <td className="px-6 py-4 text-gray-600">10% off 2 subjects, more for Ultimate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualification */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-green-700 text-lg">LIVE COURSES</p>
          <p className="text-green-600 text-sm mt-1">Year 5-13</p>
          <p className="text-green-600 text-sm">All subjects</p>
          <p className="font-bold text-green-800 mt-3">£80/mo or £319/yr</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-bold text-blue-700 text-lg">MULTI-SUBJECT</p>
          <p className="text-blue-600 text-sm mt-1">2+ subjects</p>
          <p className="text-blue-600 text-sm">10% off 2, more for 3+</p>
          <p className="font-bold text-blue-800 mt-3">£574.20/yr (2 subs)</p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-bold text-gray-500 text-lg">NOT AVAILABLE</p>
          <p className="text-gray-400 text-sm mt-1">Below Year 5</p>
          <p className="text-gray-400 text-sm">Not currently offered</p>
          <p className="font-medium text-gray-500 mt-3">Check siblings</p>
        </div>
      </div>

      {/* 3 Closes */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <h3 className="font-bold text-green-900 mb-4">3 Closes to Memorize</h3>
        <div className="space-y-3">
          {[
            { name: 'Main Concern', script: '"What\'s your main concern? What are you afraid of happening?"' },
            { name: 'Best/Worst', script: '"Best case: confident kid. Worst case: 14-day refund. Which risk makes sense?"' },
            { name: 'Reason', script: '"The reason you\'re telling yourself not to is exactly why you should."' },
          ].map((close, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
              <span className="font-bold text-green-700">{close.name}:</span>
              <span className="text-gray-700 ml-2 italic">{close.script}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proof Points */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Proof Points by Pain</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { pain: 'Engagement / motivation', proof: '25 chat messages per student per lesson' },
            { pain: 'Results / grades', proof: '58% GCSE students achieved 7-9 (2x national avg)' },
            { pain: 'Quality concerns', proof: '95% parent satisfaction, 1,700+ Trustpilot reviews' },
            { pain: 'Price concerns', proof: '£4-5/lesson vs £40-60/hr for a tutor' },
          ].map((item, idx) => (
            <div key={idx} className="px-6 py-4 flex items-center hover:bg-gray-50 transition-colors">
              <span className="text-gray-600 w-48 flex-shrink-0">{item.pain}</span>
              <span className="font-medium text-gray-900">{item.proof}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Banned Words */}
      <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
        <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Words to NEVER Use
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Personalised learning', 'Maths can be fun!', 'World-class', 'Unlock potential',
            'Learning journey', 'Empower', 'SUPER excited', 'AMAZING', 'How are you today?'
          ].map((word, idx) => (
            <span key={idx} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium border border-red-200">
              {`"${word}"`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ICONS
// ============================================

function FlowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
