(function () {
  'use strict';

  var fortunes = [
    'This meeting could have been an email. So could the next one.',
    'A calendar invite will arrive with no agenda. You may decline.',
    'Someone will book a meeting to prepare for another meeting.',
    'A thread with forty replies ends when one person calls.',
    'Reply all will be used correctly today. Historians will note it.',
    'A well-placed emoji will resolve more than words could.',
    'Your camera stays off today and nobody asks about it.',
    'A colleague will say "quick question." It will not be quick.',
    'You will mute yourself and talk anyway. Everyone does.',
    'The wifi will drop the moment you start talking.',
    'The printer will work on the first try. Tell no one.',
    'Your inbox will hit zero for eleven glorious minutes.',
    'Somebody will bring snacks. You will not know who.',
    'A spreadsheet will save the day. It always does.',
    'Say yes to the hallway chat. It is the real meeting.',
    'The best idea today comes from the person who joined late.',
    'The new hire will ask what nobody else dared to ask.',
    'The quiet one in the room is right. Go ask them.',
    'Someone will call your idea obvious. That means it worked.',
    'You will fix something nobody notices, and that is fine.',
    'Someone speaks well of you in a room you are not in.',
    'The dress you keep opening in another tab will go on sale.',
    'That thing in your cart is about to drop thirty percent.',
    'Buy the shoes. You have thought about them for a month.',
    'Your online order arrives early and it fits.',
    'Someone will ask where you got it. Enjoy that.',
    'The earrings are not too much. Wear both pairs.',
    'The lipstick you lost is in the coat you wore last week.',
    'Your hair will behave tomorrow. Take a photo.',
    'Free shipping will appear at exactly the right moment.',
    'The last one in your size exists. Go and look.',
    'That top looks better on you than it did on the hanger.',
    'The mirror in the good lighting is the honest one.',
    'A flight you have been watching will drop in price.',
    'A hotel will upgrade you for no reason at all.',
    'Your bag will come out first on the carousel.',
    'The window seat is yours. Nobody claims the middle.',
    'That trip you keep almost booking is cheaper on a Tuesday.',
    'The queue you pick will be the fast one, just once.',
    'Somebody will cancel and you will get the table.',
    'Your coffee will be free today. Do not ask why.',
    'The parcel says delivered and this time it is true.',
    'You will find money in a coat you have not worn in months.',
    'The restaurant will have the thing you wanted. In stock.',
    'Someone will make you a drink without being asked.',
    'Your next good idea arrives during a coffee refill.',
    'You will find the thing. It is in the other bag.',
    'Your good pen is in the other jacket.',
    'The charger is behind the couch. It has always been there.',
    'You will open the fridge twice for the same reason.',
    'The snack you are thinking about is worth it.',
    'The leftovers are better on day two. This is science.',
    'You will recall the name three hours after you needed it.',
    'You will win an argument tonight, in the shower, alone.',
    'Drink some water. That is the entire fortune.',
    'Your phone is at four percent and you already know it.',
    'A nap is not procrastination if you put it on the calendar.',
    'Two of your tabs are playing audio. Only one is your fault.',
    'The song stuck in your head by 2pm has already started.',
    'You will say "I am on my way" before leaving. As is tradition.',
    'The group chat will pick a restaurant. Eventually.',
    'The plant is not dead. Water it and see.',
    'The shortcut is not shorter, but it is more interesting.',
    'You will be right about the weather and nobody believes you.',
    'Your future self says thank you for the thing you did today.',
    'Leave the house. The good thing is outside today.',
    'Someone is about to recommend you something excellent.',
    'You will rewatch the comfort show instead of the new one.'
  ];

  var wrap = document.getElementById('cookieWrap');
  var btn = document.getElementById('crackBtn');
  var text = document.getElementById('fortuneText');
  var cracked = false;

  function pickFortune() {
    var last = text.textContent;
    var next = last;
    while (next === last && fortunes.length > 1) {
      next = fortunes[Math.floor(Math.random() * fortunes.length)];
    }
    text.textContent = next;
  }

  btn.addEventListener('click', function () {
    if (!cracked) {
      cracked = true;
      pickFortune();
      wrap.classList.add('cracked');
      btn.textContent = 'Crack another';
    } else {
      wrap.classList.remove('cracked');
      window.setTimeout(function () {
        pickFortune();
        wrap.classList.add('cracked');
      }, 350);
    }
  });
})();
