#!/usr/bin/env node
import { extractDodZeroTrust } from '../tools/importers/dod-zt-extract.mjs';

const result = await extractDodZeroTrust();
const { taxonomy: _taxonomy, ...summary } = result;
console.log('DoD ZT extraction complete:', summary);
