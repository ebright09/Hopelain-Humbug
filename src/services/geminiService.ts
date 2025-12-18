// Gemini API service for generating CMO briefs
// Note: In production, this would use the actual Gemini API
// For now, we use a fallback with pre-written witty responses

const FALLBACK_BRIEFS: Record<string, string[]> = {
  excellent: [
    "Your strategic acumen has temporarily suspended my disappointment in this generation of MBAs. The Value Wedge isn't just a concept to you—it's a weapon. Enjoy this fleeting moment of competence.",
    "I've seen McKinsey partners with less strategic clarity. Your WTP intuition is almost... acceptable. Don't let it go to your head—the market corrects for hubris.",
    "Remarkable. You've demonstrated that Haas hasn't completely abandoned rigor. Your understanding of brand moats suggests you might actually survive your first CMO role. Might.",
    "The board would be impressed. I'm merely... not actively disappointed. Your grasp of positioning suggests you've been paying attention. Continue this trajectory.",
    "Strategic ascension achieved. You've proven that not all MBA candidates are expensive PowerPoint generators. Your Value Wedge is wide and your soul is intact.",
  ],
  good: [
    "Acceptable performance. Your understanding of brand architecture won't get you fired immediately. The Value Wedge concept has clearly penetrated your neural pathways. Keep climbing.",
    "You've demonstrated competence, which in today's marketing landscape is practically exceptional. Your mental availability is high. Capitalize on it.",
    "Not bad for someone who probably still Googles 'what is CLV.' Your brand soul shows promise—don't let corporate bureaucracy optimize it into oblivion.",
    "Your strategic instincts are developing. The 60/40 rule clearly resonates. Now apply it before your CFO reallocates your budget to 'efficiency initiatives.'",
    "Passing grade achieved with minimal embarrassment. Your understanding of the benefits ladder suggests you might actually climb it someday.",
  ],
  poor: [
    "Your strategic clarity is roughly equivalent to a Magic 8-Ball's. The Value Wedge weeps. Consider pivoting to a career where WTP is irrelevant—like government work.",
    "I've witnessed category commoditization less painful than this performance. Your brand soul appears to be on life support. Immediate strategic intervention required.",
    "The Inferno of Incompetence has claimed another victim. Your understanding of positioning suggests you'd place Ferrari next to Kia in a perceptual map.",
    "Byron Sharp would demand his theories back after seeing this. Your mental availability is negative. Your physical availability to marketing roles should be too.",
    "This performance represents a negative brand equity event for your career. Your Value Wedge has collapsed. The CFO is already reallocating your budget.",
  ],
  terrible: [
    "Strategic liquidation complete. Your career WTP has achieved commodity status. I've seen interns with better positioning instincts. Consider LinkedIn for 'growth opportunities.'",
    "WASTED. Your understanding of marketing strategy suggests you believe 'brand soul' is something you sell to a crossroads demon. It's not. Usually.",
    "The market has spoken, and it said 'no.' Your grasp of the Value Wedge is approximately that of a wet paper towel. Recommend immediate remedial education.",
    "Catastrophic strategic failure. Your brand moat is a puddle. Your CLV calculation would make a CFO weep. The Inferno of Incompetence welcomes you.",
    "I regret to inform you that your strategic competence has filed for chapter 11. Your positioning is 'everyone, everywhere, somehow.' That's not a strategy—it's a cry for help.",
  ]
};

export const generateCMOBrief = async (score: number, sessionTitle: string): Promise<string> => {
  // Determine performance tier
  let tier: string;
  if (score >= 9) tier = 'excellent';
  else if (score >= 7) tier = 'good';
  else if (score >= 4) tier = 'poor';
  else tier = 'terrible';

  const briefs = FALLBACK_BRIEFS[tier];
  const randomBrief = briefs[Math.floor(Math.random() * briefs.length)];
  
  // Add session-specific flavor
  const sessionFlavor = getSessionFlavor(sessionTitle, score);
  
  return `${randomBrief} ${sessionFlavor}`;
};

const getSessionFlavor = (sessionTitle: string, score: number): string => {
  const flavors: Record<string, string> = {
    "Value Creation": score >= 7 
      ? "Your Value Wedge stands tall." 
      : "Your Value Wedge is a value crevice.",
    "Brand Audits": score >= 7 
      ? "The architecture holds." 
      : "Your brand house has foundation issues.",
    "Brand Soul": score >= 7 
      ? "Liquid Death would approve." 
      : "Your brand soul has been optimized into oblivion.",
    "Positioning": score >= 7 
      ? "You've climbed the ladder." 
      : "You're stuck at the attributes rung.",
    "Influencers": score >= 7 
      ? "Trust transferred successfully." 
      : "Your influencer strategy is a trust deficit.",
    "Content Strategy": score >= 7 
      ? "Category authority established." 
      : "Your content is expensive noise.",
    "Performance": score >= 7 
      ? "The funnel flows." 
      : "Your CAC exceeds your LTV. Classic.",
    "Loyalty": score >= 7 
      ? "Byron Sharp nods approvingly." 
      : "Sharp would use this as a cautionary example.",
    "Brand Moats": score >= 7 
      ? "Your moat is filling with water." 
      : "Your moat is a drainage ditch.",
    "Modern CMO": score >= 7 
      ? "P&L ownership achieved." 
      : "You're still a cost center. Fix that.",
  };
  
  return flavors[sessionTitle] || "";
};
