export const today = new Date()

export const firstDayOfCurrentYear = new Date(today.getFullYear(), 0, 1)

export const firstDayOfCurrentYearLocaleDateString = firstDayOfCurrentYear.toLocaleDateString('sv-SE')

export const todayLocaleDateString = today.toLocaleDateString('sv-SE')

export const actualYearRange = {
    from: firstDayOfCurrentYear,
    to: today
}