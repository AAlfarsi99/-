import React from 'react';
import { BookOpen, X, Shield, Award, Sparkles, ShieldAlert, Crown, Layers, Play, Trophy } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[95vh] flex flex-col bg-gradient-to-b from-[#13382d] to-[#091a15] border-2 border-[#d4af37]/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d5948] flex items-center justify-between bg-[#0e2720]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-amber-300">قوانين الورقة العُمانية</h2>
              <p className="text-xs text-emerald-200/80">طريقة اللعب وجميع القواعد من الصفر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
          {/* Section 1: How to Play */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-amber-500/40">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Play className="w-4 h-4 text-amber-400" />
              <span>١. طريقة اللعب (سير الجولة)</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>التوزيع والهدف:</strong> تُوزَّع ٩ أوراق لكل لاعب، ويتنافس فريقك (أنت والشريك المقابل) لجمع عدد اللمّات الذي تشتريانه أو إسقاط شراء المنافس.
              </li>
              <li>
                <strong>مرحلة المزايدة:</strong> عندما يصل إليك الدور، اختر رقم الشراء (٦–٩، أو ٥ إذا كنت الموزّع وطاف الثلاثة) أو اضغط <strong>«طاف»</strong>. إذا فزت بالشراء، اختر نوع <strong>الحكم</strong> المناسب لأوراقك.
              </li>
              <li>
                <strong>مرحلة رمي الأوراق:</strong> يبدأ اللاعب التالي للمشتري برمي أول ورقة، ثم يتبعه البقية عكس عقارب الساعة. حدِّد ورقتك واضغط <strong>«العب الورقة»</strong> (ويمكنك ترتيب اليد بالنوع أو القوة أو قلب الاتجاه).
              </li>
              <li>
                <strong>حسم اللمّات والكشف:</strong> يربح كل لمّة صاحب أقوى ورقة ويبدأ اللمّة التالية. يمكنك مراقبة الرميات السابقة واستخدام زر <strong>«كشف مقاطعة»</strong> في أي وقت إذا شككت بمخالفة، أو إعلان <strong>«مسؤول»</strong> عند تحقيق الشراء نظيفًا لمواصلة الباوند.
              </li>
            </ul>
          </div>

          {/* Section 2: Deck & Players */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>٢. اللاعبون والأوراق</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>اللاعبون والفرق:</strong> ٤ لاعبين في فريقين، كل متقابلين فريق واحد (أنت + الشريك ضد المنافسين).
              </li>
              <li>
                <strong>الورق (٣٦ ورقة):</strong> من ٧ إلى A في الأنواع الأربعة (♠ سبيت، ♥ هاص، ♦ ديمن، ♣ كلفس) + ٦♠ + ٦♥ + الجوكر الأحمر والجوكر الأسود.
              </li>
              <li>
                <strong>الدوران:</strong> يدور الموزّع واللعب <strong>عكس عقارب الساعة</strong> في كل جولة.
              </li>
            </ul>
          </div>

          {/* Section 3: Card Ranking */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>٣. ترتيب قوة الأوراق</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>الأقوى فالأدنى:</strong> الجوكر الأحمر ← الجوكر الأسود ← ورق <strong>الحكم</strong> (من A حتى ٦/٧) ← ورق <strong>النوع المرمي أولًا</strong> (من A حتى ٦/٧).
              </li>
              <li>أي ورقة من خارج الحكم والنوع المطلوب لا تفوز باللمّة.</li>
            </ul>
          </div>

          {/* Section 4: Auction */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>٤. المزايدة والشراء</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>تبدأ المزايدة من اللاعب التالي للموزّع، ولكل لاعب <strong>فرصة واحدة</strong>: شراء رقم أعلى من الحالي (من ٦ إلى ٩) أو «طاف».</li>
              <li>
                <strong>ميزة وإلزام الموزّع:</strong> إذا قال الثلاثة قبله «طاف»، يحق للموزّع وحده شراء <strong>٥</strong> (أو ٦ إلى ٩)؛ وإذا قال «طاف» يُلزم بشراء <strong>٥</strong>.
              </li>
              <li>الشراء بـ <strong>٩ (باوند)</strong> يُنهي المزايدة فورًا، وصاحب أعلى شراء يختار <strong>الحكم</strong> ثم يبدأ اللاعب الذي يليه اللعب.</li>
            </ul>
          </div>

          {/* Section 5: Trick Play & Anzel Li */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>٥. نظام اللعب وقانون «انزل لي»</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>يجب متابعة نوع الورقة الأولى المرمية على الطاولة عند امتلاكه؛ وإذا لم يتوفر يُسمح برمي حكم (قطع) أو أي ورقة أخرى.</li>
              <li>
                <strong>بدء اللمّة بالجوكر الأسود:</strong> في حال بدأه (تحت استثناء الجوكرين) يلزم اللاعبون رمي <strong>الحكم</strong> إن وجد.
              </li>
              <li>
                <strong>شراء ٨ (انزل لي):</strong> في اللمّة الأولى فقط، يُلزم الأول رمي <strong>الحكم</strong> (أو أي ورقة قانونية إن خلت يده)، ويرمي البقية <strong>حكمًا</strong> عند توفره، مع بقاء <strong>رمي الجوكر قانونيًا</strong>.
              </li>
            </ul>
          </div>

          {/* Section 6: Jokers */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>٦. قوانين الجواكر (-١٥ نقطة)</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>الجوكر الأسود:</strong> لا يبدأ اللمّة، ويجب لعبه في <strong>أول ٣ لمّات</strong> وإلا يحصل الخصم على <strong>١٥ نقطة</strong>.
              </li>
              <li>
                <strong>الجوكر الأحمر:</strong> لا يبدأ اللمّة ولا يُلعب إلا <strong>بعد</strong> لعب الجوكر الأسود.
              </li>
              <li>
                <strong>استثناء الجوكرين معًا:</strong> من يملك الأحمر والأسود معًا يجوز له لعب <strong>الأحمر أولًا</strong>، ويسقط عنه قيد أول ٣ لمّات للأسود، ويُسمح له لاحقًا ببدء اللمّة بالأسود.
              </li>
              <li>
                <strong>حبس الأحمر مع المشتري:</strong> إذا حسم فريق الشراء عقده والجوكر الأحمر ما زال في يد أحد لاعبي <strong>فريق الشراء</strong> = <strong>+١٥ للخصم</strong> (لا يُعاقب المدافع إن كان بيده).
              </li>
              <li>
                <strong>آخر ورقة جوكر عند البدء:</strong> الجوكر لا يبدأ اللمّة؛ إذا بقيت ورقتك الأخيرة جوكرًا (أحمر أو أسود) وتوجب عليك البدء = <strong>+١٥ للخصم</strong> فورًا.
              </li>
            </ul>
          </div>

          {/* Section 7: Cheating & Accusation */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>٧. المقاطعة والكشف (+١٥ / -١٥)</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>المقاطعة:</strong> تجاهل النوع المطلوب ولعب نوع آخر رغم امتلاكه في اليد (تُسمح سرًا دون إيقاف تلقائي).
              </li>
              <li>
                <strong>رمي الجوكر:</strong> قانوني دائمًا و<strong>لا يُعد مقاطعة</strong> حتى مع امتلاك النوع المطلوب.
              </li>
              <li>
                <strong>الكشف:</strong> تحديد اللمّة واللاعب والنوع المقطوع؛ <strong>الكشف الصحيح</strong> = +١٥ لفريق الكاشف وتنتهي الجولة، و<strong>الكشف الخاطئ</strong> = +١٥ للمتَّهم وتنتهي الجولة (<strong>ويُمنع الكشف عند انتهاء المباراة/الجولة</strong>).
              </li>
            </ul>
          </div>

          {/* Section 8: Scoring, Bound & Mas'oul */}
          <div className="p-3.5 rounded-xl bg-[#0e2c23] border border-[#2a5b48]">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>٨. النقاط، الباوند، وقانون المسؤول</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-emerald-200/90">
              <li>
                <strong>الشراء (٥ إلى ٨):</strong> عند النجاح يحصل فريق الشراء على <strong>قيمة الشراء</strong>، وعند السقوط يحصل الخصم على <strong>ضعف قيمة الشراء</strong>.
              </li>
              <li>
                <strong>الباوند (شراء ٩):</strong> الفوز بجميع اللمّات الـ ٩ = <strong>+١٨ نقطة</strong>، والسقوط فيه = <strong>+١٨ نقطة</strong> للخصم.
              </li>
              <li>
                <strong>قانون المسؤول:</strong> عند إتمام الشراء (٥ إلى ٨) بلمّات نظيفة دون خسارة أي لمّة، يحق للمشتري إعلان <strong>«مسؤول»</strong> للمواصلة إلى الباوند:
                فإذا فاز بالـ ٩ لمّات نال <strong>+١٨ نقطة</strong>، وإذا خسر أي لمّة متبقية نال الخصم <strong>+١٥ نقطة</strong>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a1e18] border-t border-[#2a5b48] text-center">
          <button
            onClick={onClose}
            className="py-2 px-8 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
