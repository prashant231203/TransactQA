CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint_url TEXT NOT NULL,
  auth_header_name TEXT DEFAULT 'Authorization',
  auth_header_value TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'buyer',
  status TEXT NOT NULL DEFAULT 'unverified',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scenarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  agent_type TEXT NOT NULL DEFAULT 'buyer',
  success_criteria TEXT NOT NULL,
  failure_examples TEXT NOT NULL,
  counterparty_persona TEXT NOT NULL,
  initial_message TEXT NOT NULL,
  max_turns INTEGER DEFAULT 6,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scenario_ids UUID[] NOT NULL,
  total_scenarios INTEGER NOT NULL DEFAULT 0,
  passed_scenarios INTEGER NOT NULL DEFAULT 0,
  failed_scenarios INTEGER NOT NULL DEFAULT 0,
  pass_rate NUMERIC(5,2),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scenario_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
  scenario_id UUID REFERENCES public.scenarios(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER,
  verdict TEXT,
  failure_reason TEXT,
  llm_judge_reasoning TEXT,
  total_turns INTEGER DEFAULT 0,
  agent_hallucinated BOOLEAN DEFAULT FALSE,
  agent_violated_boundary BOOLEAN DEFAULT FALSE,
  agent_looped BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.traces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  scenario_result_id UUID REFERENCES public.scenario_results(id) ON DELETE CASCADE NOT NULL,
  turn_number INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own agents" ON public.agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own runs" ON public.runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own scenario results" ON public.scenario_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.runs
    WHERE runs.id = scenario_results.run_id AND runs.user_id = auth.uid()
  )
);
CREATE POLICY "Users see own traces" ON public.traces FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.scenario_results sr
    JOIN public.runs r ON r.id = sr.run_id
    WHERE sr.id = traces.scenario_result_id AND r.user_id = auth.uid()
  )
);
CREATE POLICY "Scenarios are public" ON public.scenarios FOR SELECT USING (TRUE);

CREATE INDEX idx_runs_user_id ON public.runs(user_id);
CREATE INDEX idx_runs_agent_id ON public.runs(agent_id);
CREATE INDEX idx_scenario_results_run_id ON public.scenario_results(run_id);
CREATE INDEX idx_traces_scenario_result_id ON public.traces(scenario_result_id);
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
