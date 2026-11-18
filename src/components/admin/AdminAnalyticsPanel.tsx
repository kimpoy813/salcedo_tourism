"use client";
import {useState, type ReactNode} from "react";
import {Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {FactList} from "@/components/ui/FactList";

export interface DashboardMetrics {
  inventory: {
    totalAttractions: number;
    totalCafes: number;
    totalResorts: number;
    totalRestaurants: number;
    totalAccommodations: number;
    totalBusinesses: number;
    totalBarangays: number;
    upcomingEvents: number;
    draftOrPendingPlaces: number;
  };
  digitalVisits: {
    metricDefinition: string;
    appVisitSessionsToday: number;
    appVisitSessionsThisMonth: number;
    totalAppVisitSessions: number;
    monthlyPageViews: number;
    placeDetailViews: number;
    mostViewedPlaces: Array<{
      placeId: string;
      name: string;
      placeType: string;
      views: number;
    }>;
    popularCategories: Array<{ category: string; views: number }>;
    searchTrends: Array<{ query: string; count: number }>;
  };
  plannedTourism: {
    metricDefinition: string;
    totalSubmittedItineraries: number;
    tripsCompleted?: number;
    stopsVisited?: number;
    tripRatingsSubmitted?: number;
    itinerariesSubmittedToday: number;
    plannedTravelerCount: number;
    popularPlannedDestinations: Array<{ placeId: string; name: string; stops: number }>;
    upcomingPlannedDates: Array<{ date: string; plannedTravelers: number }>;
    travelPurposes: Array<{ purpose: string; count: number }>;
    visitorOriginsByProvince: Array<{
      province: string;
      submissions: number;
      travelers: number;
    }>;
    groupSizes: Array<{ bucket: string; count: number }>;
  };
  physicalArrivals: {
    metricDefinition: string;
    hasVerifiedDataSource: boolean;
    verifiedArrivalsTotal: number;
    verifiedArrivalsToday: number;
    arrivalsByDestination: Array<{ placeId: string; name: string; count: number }>;
  };
  dailyTrends: Array<{
    date: string;
    appSessions: number;
    itineraries: number;
    verifiedArrivals: number;
  }>;
  spotRankings?: {
    mostVisited: Array<{ rank: number; placeId: string; name: string; placeType: string; visitCount: number; views: number; arrivals: number; plannedStops: number; averageRating: number; ratingCount: number }>;
    topRated: Array<{ rank: number; placeId: string; name: string; placeType: string; visitCount: number; views: number; arrivals: number; plannedStops: number; averageRating: number; ratingCount: number }>;
  };
}

const count = (n:number)=>n.toLocaleString('en-PH');
const dates = new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',timeZone:'UTC'});
function dateLabel(iso:string){return dates.format(new Date(iso+'T00:00:00Z'));}

type TableRow={key:string;cells:ReactNode[]};
function ReportTable({title,description,columns,rows}:{title:string;description?:string;columns:string[];rows:TableRow[]}) {
  return <section className="report-block"><h2>{title}</h2>{description && <p className="report-note">{description}</p>}{rows.length ? <div className="report-scroll" role="region" aria-label={`${title} table`} tabIndex={0}><table className="report-table"><caption className="sr-only">{title}</caption><thead><tr>{columns.map(c=><th scope="col" key={c}>{c}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.key}>{r.cells.map((cell,i)=>i===0?<th scope="row" key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>:<p className="report-empty">No records yet.</p>}</section>;
}
function ActivityChart({days}:{days:DashboardMetrics['dailyTrends']}) {
 return <section className="report-block activity-chart"><h2>Daily activity</h2><p className="report-note">{days.length ? `${dateLabel(days[0].date)} – ${dateLabel(days[days.length-1].date)}`:'No activity recorded yet.'}</p>
 {days.length>0 && <><div className="chart-frame"><ResponsiveContainer width="100%" height="100%"><BarChart data={days} margin={{left:-20,right:6,top:10,bottom:0}}>
 <CartesianGrid vertical={false} stroke="#e1e5e0"/><XAxis dataKey="date" tickFormatter={dateLabel} axisLine={false} tickLine={false} minTickGap={25} tick={{fontSize:11,fill:'#566059'}}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#566059'}}/><Tooltip labelFormatter={label=>dateLabel(String(label))}/><Legend iconType="square" iconSize={9} wrapperStyle={{fontSize:12}}/>
 <Bar dataKey="appSessions" name="App sessions" fill="#477a69" isAnimationActive={false}/><Bar dataKey="itineraries" name="Itineraries" fill="#92622d" isAnimationActive={false}/><Bar dataKey="verifiedArrivals" name="Verified arrivals" fill="#344957" isAnimationActive={false}/></BarChart></ResponsiveContainer></div>
 <details className="chart-values"><summary>View daily figures</summary><ReportTable title="Activity by date" columns={['Date','Sessions','Itineraries','Arrivals']} rows={days.map(d=>({key:d.date,cells:[dateLabel(d.date),count(d.appSessions),count(d.itineraries),count(d.verifiedArrivals)]}))}/></details></>}
 </section>;
}
const modes=['Activity','Destinations','Trip planning'] as const;
export function AdminAnalyticsPanel({data}:{data:DashboardMetrics}) {
 const [mode,setMode]=useState<typeof modes[number]>('Activity');
 const {digitalVisits:d,physicalArrivals:a,plannedTourism:p,inventory:i,spotRankings:rank}=data;
 return <div className="office-report">
   <nav className="report-modes" aria-label="Overview reports">{modes.map(m=><button key={m} aria-pressed={m===mode} onClick={()=>setMode(m)}>{m}</button>)}</nav>
   {mode==='Activity' && <>
     <section className="report-today"><h2>Today <small>(UTC)</small></h2><dl>{[['App sessions',d.appVisitSessionsToday,'Anonymous visits to the app'],['Itineraries submitted',p.itinerariesSubmittedToday,'Plans shared with the office'],['Verified arrivals',a.verifiedArrivalsToday,'Recorded at on-site check-in']].map(([label,n,note])=><div key={label}><dt>{label}</dt><dd>{count(Number(n))}</dd><dd className="measure-note">{note}</dd></div>)}</dl></section>
     <div className="report-overview-grid"><ActivityChart days={data.dailyTrends}/><section className="report-block"><h2>Directory inventory</h2><FactList numeric rows={[["Attractions",i.totalAttractions],["Resorts",i.totalResorts],["Cafés",i.totalCafes],["Restaurants",i.totalRestaurants],["Accommodations",i.totalAccommodations],["Local businesses",i.totalBusinesses],["Barangays",i.totalBarangays],["Upcoming events",i.upcomingEvents],["Draft or pending places",i.draftOrPendingPlaces]]}/></section></div>
     <div className="report-pair"><section className="report-block"><h2>App traffic</h2><FactList numeric rows={[["Sessions this month",d.appVisitSessionsThisMonth],["Page views this month",d.monthlyPageViews],["Total app sessions",d.totalAppVisitSessions],["Total place views",d.placeDetailViews]]}/></section><section className="report-block"><h2>Recorded arrivals</h2><FactList numeric rows={[["Verified arrivals today",a.verifiedArrivalsToday],["Verified arrivals to date",a.verifiedArrivalsTotal]]}/><p className="report-note">{a.hasVerifiedDataSource?'Only verified check-ins count as physical arrivals.':'No verified on-site arrivals have been recorded.'}</p></section></div>
     <details className="directory-record"><summary>How these measures differ</summary><FactList rows={[["App sessions",d.metricDefinition],["Travel plans",p.metricDefinition],["Physical arrivals",a.metricDefinition]]}/></details>
   </>}
   {mode==='Destinations' && <>
     {rank && <><ReportTable title="Most visited" description="Ranked by place views plus verified arrivals. Views alone do not indicate an on-site visit." columns={['Destination','Rank','Views','Arrivals','Combined','Planned stops']} rows={rank.mostVisited.map(r=>({key:r.placeId,cells:[r.name,r.rank,r.views,r.arrivals,r.visitCount,r.plannedStops]}))}/><ReportTable title="Top rated" columns={['Destination','Rank','Average rating','Ratings']} rows={rank.topRated.map(r=>({key:r.placeId,cells:[r.name,r.rank,r.ratingCount?r.averageRating.toFixed(1):'—',r.ratingCount]}))}/></>}
     <div className="report-pair"><ReportTable title="Place views" columns={['Destination','Views']} rows={d.mostViewedPlaces.map(x=>({key:x.placeId,cells:[x.name,count(x.views)]}))}/><ReportTable title="Search terms" columns={['Query','Searches']} rows={d.searchTrends.map(x=>({key:x.query,cells:[x.query,count(x.count)]}))}/></div>
   </>}
   {mode==='Trip planning' && <><section className="report-block"><h2>Submitted plans</h2><p className="report-note">Group sizes are reported by visitors. They are not verified arrivals.</p><FactList numeric rows={[["Itineraries submitted",p.totalSubmittedItineraries],["Planned travelers",p.plannedTravelerCount],["Completed trips",p.tripsCompleted],["Stops marked visited",p.stopsVisited],["Trip ratings submitted",p.tripRatingsSubmitted]]}/></section>
     <div className="report-pair"><ReportTable title="Planned destinations" columns={['Destination','Planned stops']} rows={p.popularPlannedDestinations.map(x=>({key:x.placeId,cells:[x.name,count(x.stops)]}))}/><ReportTable title="Origins by province" columns={['Province','Trips','Travelers']} rows={p.visitorOriginsByProvince.map(x=>({key:x.province,cells:[x.province,count(x.submissions),count(x.travelers)]}))}/><ReportTable title="Group sizes" columns={['Group','Trips']} rows={p.groupSizes.map(x=>({key:x.bucket,cells:[x.bucket,count(x.count)]}))}/><ReportTable title="Upcoming visit dates" columns={['Planned date','Travelers']} rows={p.upcomingPlannedDates.map(x=>({key:x.date,cells:[x.date,count(x.plannedTravelers)]}))}/></div></>}
 </div>;
}
