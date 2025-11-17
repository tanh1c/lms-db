const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface ScheduleItem {
  Section_ID: number
  Course_ID: number
  Course_Name: string
  Day: string
  Time: string
  Room: string
  Building: string
}

export const scheduleService = {
  async getSchedule(_userId: number): Promise<ScheduleItem[]> {
    await delay(500)
    // Mock schedule data
    return [
      {
        Section_ID: 1,
        Course_ID: 1,
        Course_Name: 'Cơ sở dữ liệu',
        Day: 'Monday',
        Time: '07:00 - 09:00',
        Room: '101',
        Building: 'A1',
      },
      {
        Section_ID: 1,
        Course_ID: 1,
        Course_Name: 'Cơ sở dữ liệu',
        Day: 'Wednesday',
        Time: '07:00 - 09:00',
        Room: '101',
        Building: 'A1',
      },
      {
        Section_ID: 3,
        Course_ID: 2,
        Course_Name: 'Lập trình Web',
        Day: 'Tuesday',
        Time: '09:00 - 11:00',
        Room: '201',
        Building: 'A2',
      },
    ]
  },
}

