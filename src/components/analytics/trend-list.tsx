import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TrendItem {
  label: string
  value: string
}

interface TrendListProps {
  title: string
  items: TrendItem[]
}

export function TrendList({ title, items }: TrendListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No trend data available yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
