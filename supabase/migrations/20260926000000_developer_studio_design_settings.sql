ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS design_settings jsonb NOT NULL DEFAULT '{
    "header":{"height":72,"bgColor":"#111827","textColor":"#e5e7eb","hoverColor":"#fb923c","borderColor":"#1f2937","borderWidth":1,"fontSize":14,"fontWeight":700},
    "hero":{"borderWidth":0,"borderColor":"#e5e7eb","radius":0,"shadow":"none"},
    "buttons":{"radius":8,"fontWeight":700,"hoverScale":1.03,"transitionMs":200,"bgColor":"#f97316","hoverBgColor":"#ea580c","textColor":"#ffffff"},
    "animations":{"enabled":true,"hoverLift":2,"clickScale":0.98}
  }'::jsonb;