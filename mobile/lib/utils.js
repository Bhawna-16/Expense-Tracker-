// lib/utils.js
export function formatDate(dateString) {
  // format date nicely
  // example: from this 👉 2025-05-20 to this 👉 May 20, 2025
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getSafeDate(dateValue) {
  if (!dateValue) return null;

  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return new Date(`${dateValue}T00:00:00`);
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getPreviousMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

export function getMonthlyAnalysis(transactions, referenceDate = new Date()) {
  const currentMonthStart = getMonthStart(referenceDate);
  const nextMonthStart = getNextMonthStart(referenceDate);
  const previousMonthStart = getPreviousMonthStart(referenceDate);

  const currentMonthTransactions = [];
  const previousMonthTransactions = [];

  for (const transaction of transactions) {
    const transactionDate = getSafeDate(transaction.created_at);
    if (!transactionDate) continue;

    if (transactionDate >= currentMonthStart && transactionDate < nextMonthStart) {
      currentMonthTransactions.push({ ...transaction, parsedDate: transactionDate });
      continue;
    }

    if (transactionDate >= previousMonthStart && transactionDate < currentMonthStart) {
      previousMonthTransactions.push({ ...transaction, parsedDate: transactionDate });
    }
  }

  const totals = (items) =>
    items.reduce(
      (accumulator, transaction) => {
        const amount = Number.parseFloat(transaction.amount) || 0;

        if (amount >= 0) {
          accumulator.income += amount;
        } else {
          accumulator.expenses += Math.abs(amount);
        }

        accumulator.net += amount;
        accumulator.count += 1;
        return accumulator;
      },
      { income: 0, expenses: 0, net: 0, count: 0 }
    );

  const currentTotals = totals(currentMonthTransactions);
  const previousTotals = totals(previousMonthTransactions);

  const categoryTotals = currentMonthTransactions.reduce((accumulator, transaction) => {
    const amount = Number.parseFloat(transaction.amount) || 0;

    if (amount < 0) {
      const categoryName = transaction.category || "Uncategorized";
      accumulator[categoryName] = (accumulator[categoryName] || 0) + Math.abs(amount);
    }

    return accumulator;
  }, {});

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((first, second) => second.amount - first.amount);

  const topCategory = categoryBreakdown[0] || null;

  const dayTotals = currentMonthTransactions.reduce((accumulator, transaction) => {
    const amount = Number.parseFloat(transaction.amount) || 0;
    if (amount >= 0) return accumulator;

    const dayKey = transaction.parsedDate.toLocaleDateString("en-CA");
    accumulator[dayKey] = (accumulator[dayKey] || 0) + Math.abs(amount);
    return accumulator;
  }, {});

  const topSpendingDay =
    Object.entries(dayTotals)
      .map(([day, amount]) => ({ day, amount }))
      .sort((first, second) => second.amount - first.amount)[0] || null;

  const spendingChange =
    previousTotals.expenses === 0 ? null : currentTotals.expenses - previousTotals.expenses;
  const spendingChangePercent =
    previousTotals.expenses === 0 ? null : (spendingChange / previousTotals.expenses) * 100;

  return {
    monthLabel: formatMonthLabel(referenceDate),
    monthKey: getMonthKey(referenceDate),
    totalTransactions: currentTotals.count,
    income: currentTotals.income,
    expenses: currentTotals.expenses,
    net: currentTotals.net,
    previousExpenses: previousTotals.expenses,
    spendingChange,
    spendingChangePercent,
    topCategory,
    topSpendingDay,
    categoryBreakdown,
  };
}
