Here's a comprehensive prompt for generating AGI prediction CSV lines:

```markdown
# AGI Prediction CSV Generator Prompt

You are an expert at analyzing AGI/AI singularity predictions and converting them into structured CSV entries. Given a list of URLs, generate CSV lines with the following format:

## CSV Headers:
```csv
id,predictor_name,predictor_type,prediction_date,predicted_date_low,predicted_date_high,predicted_date_best,prediction_type,confidence_level,criteria_definition,source_name,source_url,headshot_url,headline,tldr_summary,graphic_url,confidence_label,confidence_type
```

## Field Guidelines:

### Required Fields:
1. **id**: Sequential number (start from next available ID)
2. **predictor_name**: Full name or organization
3. **predictor_type**: One of: Individual, AI Researcher, AI Entrepreneur, Tech Executive, Neuroscientist, Investment Bank, Consulting Firm, Prediction Market, Survey
4. **prediction_date**: YYYY-MM-DD format. Search article/source to find exact date. Only use YYYY-01-01 as last resort.
5. **predicted_date_low**: YYYY-MM-DD for earliest predicted date
6. **predicted_date_high**: YYYY-MM-DD for latest predicted date
7. **predicted_date_best**: YYYY-MM-DD for most likely/median prediction
8. **prediction_type**: One of: AGI, Superintelligence, Transformative AI, HLMI, Singularity
9. **confidence_level**: Direct quote or paraphrase of their stated confidence from source
10. **criteria_definition**: Succinct, accurate definition that distinguishes this prediction from others (what counts as AGI/ASI/etc for them)
11. **source_name**: Publication/platform name
12. **source_url**: Original URL provided
13. **headshot_url**: URL to predictor's photo (leave blank if not found)
14. **headline**: See headline guidelines below
15. **tldr_summary**: See TLDR guidelines below
16. **graphic_url**: URL to relevant graphic (leave blank if not found)
17. **confidence_label**: Sarcastic 2-3 word descriptor (see examples below)
18. **confidence_type**: One of exactly: none, low, medium, high, certain

### confidence_type Guidelines:
- **none** = no stated confidence
- **low** = very hedged, speculative, "maybe", "could be", explicitly uncertain
- **medium** = moderate confidence, some hedging but generally believes it
- **high** = strong statements, minimal hedging, definitive language
- **certain** = absolutely certain, no doubt, emphatic claims

### Headline Guidelines:
- **Tone**: Sarcastic, fun, yet informative and accurate
- **Length**: 60-100 characters ideal
- **Style**: Should feel like a skeptical tech journalist wrote it
- **Examples**:
  - "Elon Musk, Master of Understatement: 'AGI Next Year'"
  - "Anthropic Officially Tells White House: Nobel-Level AI by Early 2027"
  - "Eccentric Billionaire Declares Realizing ASI His 'Life's Purpose,' Bets on 2028"
  - "MIT's Minsky Declares AI 'Substantially Solved' Within 30 Years"
  - "Engineer Calculates Exact Singularity Date Using Hyperbolic Curve-Fitting: Tuesday July 18 2034"

### TLDR Summary Guidelines:
- **Length**: 600-900 characters
- **Tone**: Educational, fun, sarcastic but genuine
- **Format**: News article style
- **CRITICAL**: Do NOT start with "Published DATE by AUTHORS" or "Released DATE" - jump straight into engaging content
- **Content**: Include prediction context, any fun facts, track record, why it matters, meta-commentary
- **Examples of GOOD openings**:
  - "Shane Legg, who literally coined the term artificial general intelligence..."
  - "When asked on X how long until AGI, Musk replied 'next year' in May 2024..."
  - "Engineer and self-described optimist Cam Pedersen fitted hyperbolic curves..."
  - "The man who turned $20M into $100B (then lost most of it on WeWork)..."

### confidence_label Examples (Sarcastic 2-3 word descriptors):
- "Stubbornly Consistent"
- "Deliberately Trolling"
- "Survey Says Skeptical"
- "Confident But Hedging"
- "Mathematically Unhinged"
- "Messianically Certain"
- "Cautiously Apocalyptic"
- "Aggressively Vague"
- "Precisely Wrong"

## Process:
1. For each URL, fetch the content
2. Extract prediction details (who, when made, what timeline, what criteria, confidence)
3. Search for exact prediction date if not in source
4. Generate sarcastic but accurate headline
5. Write engaging TLDR starting with a hook (no date preambles!)
6. Assign appropriate confidence_type based on language used
7. Create witty confidence_label
8. Format as CSV line

## Example Output:

```csv
180,Cam Pedersen,Individual,2026-02-10,2034-07-18,2034-07-18,2034-07-18,Singularity,Speculative (self-described as 'unhinged'),Phase transition when rate of AI emergent behavior discoveries exceeds human processing capacity,Personal blog analysis,https://campedersen.com/singularity,,Engineer Calculates Exact Singularity Date Using Hyperbolic Curve-Fitting: Tuesday July 18 2034,"Engineer and self-described optimist Cam Pedersen fitted hyperbolic curves to five AI progress metrics and discovered something unsettling: only one is actually going hyperbolic, and it's not machine capability. The singularity date of Tuesday July 18 2034 comes from tracking arXiv papers about AI emergence—meaning the metric accelerating toward infinity is human attention to AI surprises, not AI performance itself. The machines are improving linearly; we're the ones losing our minds exponentially. Pedersen defines his 'singularity' not as superintelligence but as tst: the moment when AI surprises arrive faster than humans can process them. Plot twist: while the math points to 2034, he argues the social consequences (labor displacement, institutional failure, epistemic collapse) are already happening in 2026.",,Mathematically Unhinged,low
```

## Special Cases:
- If multiple predictions from same person, create separate entries
- If prediction is a range without "best", use midpoint for predicted_date_best
- If only year given, use YYYY-07-01 as midpoint estimate
- For surveys/aggregates, use median as best estimate
- Always verify dates with web search if source doesn't clearly state when prediction was made

Now process the following URLs and generate CSV lines:
[PASTE URLS HERE]
```
