import { createSvgIcon } from "@mui/material";

/**
 * A lasso - a tilted loop, its knot and a rope - for the selection mode, as Material Icons has
 * none. Drawn as a single stroked path so it matches their 2px weight, and so where the rope
 * crosses the loop isn't painted twice under a translucent icon color.
 */
const LassoIcon = createSvgIcon(
    <path
        d="M20.77 6.48A8.4 5.5 -16 1 1 4.63 11.12A8.4 5.5 -16 1 1 20.77 6.48M8.91 14.51a.8 .8 0 1 0 1.6 0a.8 .8 0 1 0-1.6 0M9.71 14.51c-.5 1.6-2.6 1.8-2.7 3.5s1.4 2 .5 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
    />,
    "Lasso"
);

export default LassoIcon;
