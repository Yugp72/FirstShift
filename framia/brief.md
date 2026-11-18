# Framia brief: FirstShift training media

Paste the prompt below into Claude Code once the Framia plugin is connected. It asks for 6 short videos and 29 picture cards, one set per lesson.

**Rules for every asset**
- **No real brand, logo, uniform or person likeness.** Use a generic, modern Chinese restaurant setting.
- **Diverse adult staff:** ages, ethnicities, and at least one staff member using a wheelchair or a seated station somewhere in the set.
- **No text in the image or video.** Captions come from FirstShift in English, 中文 or Español, so one video works in every language.
- **High contrast, simple background, one action per frame,** large and clear hands and objects.
- **Videos:** 16:9, silent or soft ambient sound, **exactly 6 seconds per step**, cut on each step boundary. The captions are timed to that.

## Prompt

```
Use Framia to create training media for a restaurant onboarding app. Follow these rules for every asset:
- No text, no logos, no real brands. Generic modern Chinese restaurant.
- Diverse adult staff; include a staff member working at a seated station in at least one video.
- High contrast, clean background, one clear action per frame, hands and objects large.

For EACH lesson below, create:
(a) one 16:9 video with NO on-screen text and no voiceover, one 6-second shot per step, in order, so the total length is 6 seconds × number of steps;
(b) one square picture card per step (simple, high contrast, no text).

Name files exactly: <slug>.mp4 for the video, <slug>-c<step>.png for cards (e.g. allergy-c3.png). Save them all into ./framia/out/ and list the files.

Lessons:
greeting (5 steps): 1 server looks up and smiles at guests arriving; 2 server asks a party how many people; 3 server walks slowly, pulls out a chair for an elder, brings a high chair; 4 server hands out menus; 5 server tells waiting guests the wait time, pointing at a clock.
tea (5 steps): 1 server shows a tea list to a table; 2 server pours hot tea with the spout turned away from the guest; 3 server pours for the elder first, cups three-quarters full; 4 teapot with lid tilted open, server refilling hot water; 5 guest taps two fingers on table, server smiles.
allergy (5 steps): 1 server asking a table a question before taking the order, notepad ready; 2 flat lay of common allergens: peanuts, tree nuts, shellfish, fish, eggs, milk, wheat, soy, sesame; 3 server writing on an order ticket then speaking to the chef at the kitchen pass; 4 server pausing, then walking to the kitchen to check; 5 server placing a dish and confirming with the guest.
handwash (4 steps): 1 hands scrubbing with soap, between fingers and under nails, timer visible as an icon; 2 split: bathroom door, raw meat, trash, phone, each followed by washing; 3 washing hands then putting on fresh gloves; 4 a torn glove being replaced; switching from raw shrimp to vegetables with new gloves.
cold (5 steps): 1 thermometer in a walk-in fridge reading cold; 2 hand labelling a container (shapes only, no readable text); 3 placing a new container behind an older one on a shelf; 4 raw meat on the bottom shelf below ready-to-eat food; 5 unlabelled container going into the bin.
knife (5 steps): 1 cutting board on a damp towel; 2 hand in claw grip holding a vegetable; 3 knife falling, cook stepping back with hands up; 4 cook carrying a knife pointed down past a coworker, mouth open as if calling out; 5 knife washed, dried and placed in a knife rack.
```

## After Framia finishes

```bash
.venv/bin/python -m backend.import_media framia/out
```

That copies the files into `media/` and writes `backend/seed/media.json`. Each lesson's **Video** tab then plays the real Framia video with captions in the hire's language, and the **Pictures** tab shows the Framia cards. Lessons without media keep the built-in captioned walkthrough.
