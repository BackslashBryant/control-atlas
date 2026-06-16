#!/usr/bin/env node
import { extractDodZeroTrust } from '../tools/importers/dod-zt-extract.mjs';

const result = await extractDodZeroTrust();
console.log('DoD ZT extraction complete:', result);
