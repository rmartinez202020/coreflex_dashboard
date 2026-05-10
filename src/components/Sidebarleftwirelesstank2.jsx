// Sidebarleftwirelesstank2.jsx
import React from "react";

export default function Sidebarleftwirelesstank2({
  size = 220,
  strokeColor = "#ffffff",
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.9)}
      viewBox="0 0 780 700"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{
        display: "block",
        overflow: "visible",
        maxWidth: "100%",
      }}
    >
      <g
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* top square tank lid */}
        <path d="M58 95 L379 23 C390 20 401 20 412 22 L720 73" />
        <path d="M58 95 C48 97 42 104 43 113 C44 120 51 124 62 126" />
        <path d="M720 73 C735 76 743 84 742 94 C741 101 734 106 722 107" />
        <path d="M62 126 L398 173" />
        <path d="M398 173 L722 107" />
        <path d="M57 105 L398 153 L724 88" />
        <path d="M61 117 L398 164 L722 99" />
        <path d="M398 153 C395 160 395 166 398 173" />
        <path d="M43 113 L44 550" />
        <path d="M742 94 L741 525" />

        {/* rounded top corner details */}
        <path d="M382 153 C394 144 417 147 429 158" />
        <path d="M382 153 L382 167 C394 178 418 180 430 164 L429 158" />
        <path d="M58 95 C58 102 59 109 62 126" />
        <path d="M720 73 C722 84 722 95 722 107" />

        {/* front and side panels */}
        <path d="M44 550 L398 628" />
        <path d="M398 628 L741 533" />
        <path d="M44 535 L398 610" />
        <path d="M398 610 L741 516" />
        <path d="M398 173 L398 628" />
        <path d="M430 164 L430 612" />
        <path d="M620 128 L620 565" />
        <path d="M720 107 L720 532" />
        <path d="M62 126 L62 548" />
        <path d="M398 610 C406 617 420 617 430 612" />

        {/* bottom bevel and rounded lower edges */}
        <path d="M44 550 C46 564 55 572 72 576 L374 642" />
        <path d="M741 533 C733 548 718 557 695 564 L431 638" />
        <path d="M374 642 C393 646 414 645 431 638" />
        <path d="M398 628 C405 636 417 639 431 638" />
        <path d="M44 535 C48 543 55 548 66 551" />
        <path d="M741 516 C733 525 722 531 707 535" />

        {/* top hatch and cap */}
        <path d="M245 78 C271 45 366 33 443 47 C515 61 553 93 522 119" />
        <path d="M245 78 C226 95 239 116 282 130 C349 151 464 143 512 116" />
        <path d="M282 130 C351 164 498 151 522 119" />
        <path d="M266 83 C291 60 364 52 429 62 C489 71 521 94 497 112" />
        <path d="M266 83 C249 96 261 112 299 122 C358 138 455 132 497 112" />
        <path d="M342 38 L342 72" />
        <path d="M342 38 C356 29 398 29 413 38" />
        <path d="M342 72 C357 80 399 81 414 72" />
        <path d="M413 38 L414 72" />
        <path d="M347 37 C362 44 396 45 408 38" />
        <path d="M334 72 L423 74" />
        <path d="M334 72 C324 78 319 85 319 93" />
        <path d="M423 74 C433 80 438 87 437 94" />
        <path d="M319 93 C342 105 412 107 437 94" />
        <path d="M327 81 C352 90 405 91 429 83" />

        {/* small top port */}
        <path d="M213 96 C224 92 241 93 251 98" />
        <path d="M213 96 C205 100 207 105 218 108 C229 111 247 110 255 105" />
        <path d="M251 98 C260 102 260 106 255 109" />
        <path d="M218 108 C230 112 247 111 255 105" />
        <path d="M255 96 L277 90" />
        <path d="M263 94 L269 87" />

        {/* small fitting on hatch */}
        <path d="M333 87 C338 83 347 84 351 88" />
        <path d="M333 87 C329 92 332 98 339 99 C347 100 354 96 354 91" />
        <path d="M345 88 L363 80" />
        <path d="M342 94 L360 89" />

        {/* front lower circular ports */}
        <ellipse cx="168" cy="548" rx="18" ry="31" />
        <ellipse cx="173" cy="549" rx="13" ry="25" />
        <ellipse cx="179" cy="550" rx="8" ry="19" />
        <path d="M153 527 C164 518 184 523 195 539" />
        <path d="M151 565 C161 584 184 587 197 572" />

        <ellipse cx="340" cy="588" rx="19" ry="32" />
        <ellipse cx="345" cy="589" rx="14" ry="26" />
        <ellipse cx="351" cy="590" rx="8" ry="20" />
        <path d="M325 567 C336 557 358 563 370 579" />
        <path d="M323 604 C334 624 358 627 372 611" />

        {/* legs */}
        <path d="M46 574 L46 645" />
        <path d="M46 645 L78 654" />
        <path d="M78 654 L79 590" />
        <path d="M58 577 L92 585" />
        <path d="M92 585 L92 638" />
        <path d="M78 654 L92 638" />
        <path d="M47 633 C55 640 67 644 78 645" />

        <path d="M386 629 L386 689" />
        <path d="M386 689 L433 700" />
        <path d="M433 700 L433 640" />
        <path d="M402 632 L449 621" />
        <path d="M449 621 L449 679" />
        <path d="M433 700 L449 679" />
        <path d="M386 676 C397 684 416 690 433 691" />

        <path d="M672 551 L672 617" />
        <path d="M672 617 L711 607" />
        <path d="M711 607 L711 539" />
        <path d="M689 547 L730 535" />
        <path d="M730 535 L730 591" />
        <path d="M711 607 L730 591" />
        <path d="M672 604 C683 611 699 612 711 607" />

        {/* panel edge accents */}
        <path d="M64 128 L397 176" opacity="0.45" />
        <path d="M431 166 L720 108" opacity="0.45" />
        <path d="M65 532 L397 604" opacity="0.45" />
        <path d="M431 596 L720 516" opacity="0.45" />
      </g>
    </svg>
  );
}
