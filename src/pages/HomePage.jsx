import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  FileText,
  PieChart,
  Coins,
  History,
  Scale,
  ArrowUpRight,
  Zap,
  ArrowRightLeft,
} from "lucide-react";
import TransactionItem from "../components/domain/TransactionItem";
import { TABS } from "../config/constants";
import { normalizeDate, formatIndianCompact } from "../utils/helpers";
import { cn } from "../utils/cn";

const HomePage = ({
  transactions,
  wealthItems = [],
  setActiveTab,
  onDelete,
  settings,
  theme = "dark",
}) => {
  // --- Logic Preserved ---
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyData = transactions.filter((t) => {
      const d = normalizeDate(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const expense = monthlyData
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const netWorth = wealthItems.reduce((acc, curr) => {
      const amt = parseFloat(curr.amount || 0);
      return curr.type === "asset" ? acc + amt : acc - amt;
    }, 0);

    const totalTaxable = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);

    const estimatedTax = totalTaxable > 700000 ? totalTaxable * 0.15 : 0;

    return {
      expense,
      netWorth,
      totalTaxable,
      estimatedTax,
      count: transactions.length,
    };
  }, [transactions, wealthItems]);

  const budget = parseFloat(settings?.monthlyBudget) || 0;
  const percentage =
    budget > 0 ? Math.min(100, (metrics.expense / budget) * 100) : 0;

  // --- FAST & BOUNCY CONFIG ---
  const bouncySpring = {
    type: "spring",
    stiffness: 500,
    damping: 20,
    mass: 1,
  };

  const MetricTile = ({
    title,
    value,
    icon: Icon,
    colorClass,
    tab,
    isSpecial = false,
  }) => (
    <div className="relative group">
      {/* OUTER ICON-COLOR GLOW */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-3 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl",
          isSpecial
            ? "bg-blue-500/40"
            : colorClass?.includes("blue")
            ? "bg-blue-500/30"
            : colorClass?.includes("emerald")
            ? "bg-emerald-500/30"
            : colorClass?.includes("purple")
            ? "bg-purple-500/30"
            : colorClass?.includes("amber")
            ? "bg-amber-500/30"
            : "bg-white/20"
        )}
      />

      <motion.button
        whileHover={{ scale: 1.05, y: -10 }}
        whileTap={{ scale: 0.95 }}
        transition={bouncySpring}
        onClick={() => setActiveTab(tab)}
        className={cn(
          "relative overflow-hidden p-6 rounded-[2.5rem] border text-left w-full transition-shadow duration-300",
          isSpecial
            ? "bg-blue-600 border-blue-400 shadow-blue-500/40"
            : theme === "dark"
            ? "bg-white/10 border-white/10 backdrop-blur-md shadow-2xl"
            : "bg-white border-white shadow-xl shadow-blue-500/10"
        )}
      >
        <div
          className={cn(
            "mb-4 p-3 rounded-2xl inline-flex",
            isSpecial ? "bg-white/20 text-white" : colorClass
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div>
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
              isSpecial
                ? "text-blue-100"
                : theme === "dark"
                ? "text-blue-400/60"
                : "text-blue-600"
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-2xl font-black tracking-tighter",
              isSpecial
                ? "text-white"
                : theme === "dark"
                ? "text-white"
                : "text-indigo-950"
            )}
          >
            {value}
          </p>
        </div>
      </motion.button>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Monthly Spend Tracker */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={bouncySpring}
            className={cn(
              "relative overflow-hidden p-8 rounded-[3.5rem] border shadow-2xl",
              theme === "dark"
                ? "bg-white/[0.03] border-white/10 backdrop-blur-3xl"
                : "bg-white border-white"
            )}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
                    Monthly Spend
                  </span>
                </div>
                <h3
                  className={cn(
                    "text-5xl font-black tracking-tighter",
                    theme === "dark" ? "text-white" : "text-indigo-950"
                  )}
                >
                  ₹{metrics.expense.toLocaleString("en-IN")}
                </h3>
                <p className="text-xs font-bold opacity-40 mt-1">
                  Monthly Budget: ₹{formatIndianCompact(budget)}
                </p>
              </div>
              <div
                className={cn(
                  "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border",
                  percentage >= 100
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                )}
              >
                {percentage >= 100 ? "Limit Reached" : "On Track"}
              </div>
            </div>

            <div className="relative h-4 w-full bg-blue-500/5 rounded-full p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className={cn(
                  "h-full rounded-full shadow-lg",
                  percentage >= 100 ? "bg-rose-500" : "bg-blue-600"
                )}
              />
            </div>
          </motion.div>

          {/* ITR Tile */}
          <MetricTile
            title="Income Tax Return"
            value={
              metrics.estimatedTax > 0
                ? `₹${formatIndianCompact(metrics.estimatedTax)} Tax`
                : "File ITR Now"
            }
            icon={Scale}
            tab={TABS.ITR}
            isSpecial
          />

          {/* Bottom Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricTile
              title="Taxable"
              value={formatIndianCompact(metrics.totalTaxable)}
              icon={FileText}
              colorClass="bg-blue-500/10 text-blue-500"
              tab={TABS.WEALTH}
            />
            <MetricTile
              title="Net Worth"
              value={formatIndianCompact(metrics.netWorth)}
              icon={Coins}
              colorClass="bg-emerald-500/10 text-emerald-500"
              tab={TABS.WEALTH}
            />
            <MetricTile
              title="Analytics"
              value="Stats"
              icon={PieChart}
              colorClass="bg-purple-500/10 text-purple-500"
              tab={TABS.STATS}
            />
            <MetricTile
              title="Entries"
              value={metrics.count}
              icon={History}
              colorClass="bg-amber-500/10 text-amber-500"
              tab={TABS.HISTORY}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7">
          <div className="flex justify-between items-center mb-6 px-4">
            <h3
              className={cn(
                "font-black text-2xl tracking-tighter",
                theme === "dark" ? "text-white" : "text-indigo-950"
              )}
            >
              Recent Journal
            </h3>
            <motion.button
              whileHover={{ x: 5, color: "#030303" }}
              transition={bouncySpring}
              onClick={() => setActiveTab(TABS.HISTORY)}
              className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-50 hover:opacity-100"
            >
              Full History <ArrowRightLeft className="w-4 h-4" />
            </motion.button>
          </div>

          <motion.div
            className={cn(
              "p-6 rounded-[3.5rem] border shadow-2xl transition-all",
              theme === "dark"
                ? "bg-white/[0.02] border-white/5 backdrop-blur-md"
                : "bg-white/80 border-white/50 backdrop-blur-xl"
            )}
          >
            {transactions.length === 0 ? (
              <div className="text-center py-24 opacity-10">
                <CreditCard className="w-20 h-20 mx-auto mb-4 stroke-[1px]" />
                <p className="text-xs font-black uppercase tracking-widest">
                  No Records Found
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 6).map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ delay: idx * 0.05, ...bouncySpring }}
                  >
                    <TransactionItem item={t} onDelete={onDelete} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
