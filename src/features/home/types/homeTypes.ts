import type { SvgIconComponent } from '@mui/icons-material';

/** One step of the "How it works" guide on the home page. */
export interface GuideStep {
  title: string;
  description: string;
}

/** One application feature card on the home page. */
export interface AppFeature {
  title: string;
  description: string;
  icon: SvgIconComponent;
}

export interface AppGuide {
  steps: GuideStep[];
  features: AppFeature[];
}
