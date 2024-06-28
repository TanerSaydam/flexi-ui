# TrCurrency
This library supporting Angular version 18

## Install
`npm i tr-currency`

## Code usage
This package have an standalone pipe. If you want to use it you have to import `TrCurrencyPipe` your standalone component or your module.

## Installation
```typescript
import { TrCurrencyPipe } from 'tr-currency';

imports: [ 
    TrCurrencyPipe
]
```

## Usage
```typescript
{{money | trCurrency}}
```

## Output
```typescript
14505.50 ==> 14.505,00
```

## Usage
```typescript
//If you want to use symbol, you can use parameter that.
{{money | trCurrency : '₺'}}
```

## Output
```typescript
14505.50 ==> 14.505,50 ₺
```

## Usage
```typescript
//If you want the symbol to be first, you can stil do it with a parameter.
{{money | trCurrency : '₺' : true}}
```

## Output
```typescript
14505.50 ==> ₺14.505,50
```

## Usage
```typescript
//If you want the more or less fraction, you can stil do it with a parameter.
{{money | trCurrency : '₺' : true, 1}}
{{money | trCurrency : '₺' : true, 2}}
{{money | trCurrency : '₺' : true, 3}}
```

## Output
```typescript
14505.50 ==> ₺14.505,5
14505.50 ==> ₺14.505,50
14505.50 ==> ₺14.505,500
```