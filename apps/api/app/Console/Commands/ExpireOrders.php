<?php

namespace App\Console\Commands;

use App\Domain\Store\Actions\ExpireStaleOrders;
use Illuminate\Console\Command;

class ExpireOrders extends Command
{
    protected $signature = 'shop:expire-orders';

    protected $description = 'Expire unpaid orders whose stock hold has lapsed and release their stock';

    public function handle(ExpireStaleOrders $expire): int
    {
        $count = $expire();
        $this->info("Expired {$count} order(s).");

        return self::SUCCESS;
    }
}
