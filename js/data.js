/* giveaways data (edit here)
   - shortLinkB64 and gleamLinkB64 are Base64 encoded strings (basic obfuscation)
   - shortLink must redirect back to: giveaway.html?id=GIVEAWAY_ID&joined=1
*/

const data = {
  active: [
    {
      id: "amazon1",
      title: "$1 Amazon Gift Card Giveaway",
      description: "Win a genuine $1 Amazon gift card. Enter daily — support the prize pool by viewing sponsored content.",
      image: "assets/amazon1.png",
      short: "aHR0cHM6Ly9zaHJpbmttZS5jbGljay9UTTA2Tg==",
      link: "aHR0cHM6Ly9nbGVhbS5pby9YODZ6VS90aGUtZmlyc3QtbG9vcC0xLWFtYXpvbi1naWZ0LWNhcmQtZ2l2ZWF3YXk=",
      ends: "2025-12-01"
    }
  ],
  upcoming: [
    {
      id: "steam1",
      title: "$1 Steam Gift Card (Coming Soon)",
      description: "Launching soon — keep an eye out!",
      image: "assets/steam1.jpg",
      starts: "2025-12-10"
    },
    {
      id: "amazon2",
      title: "$2 Amazon Gift Card (Coming Soon)",
      description: "Launching soon — keep an eye out!",
      image: "assets/amazon1.png",
      starts: "2025-12-10"
    }
  ],
  ended: []
};