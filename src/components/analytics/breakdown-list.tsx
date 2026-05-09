import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BreakdownItem {
  label: string
  value: string
  color: string
}

interface BreakdownListProps {
  title: string
  items: BreakdownItem[]
}

export function BreakdownList({ title, items }: BreakdownListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No data for this filter selection.</p>
        )}
      </CardContent>
    </Card>
  )
}
