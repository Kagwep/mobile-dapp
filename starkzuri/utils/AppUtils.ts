// import { BigNumber } from "bignumber.js";
// import { shortString, num, uint256 } from "starknet";

// export function bigintToShortStr(bigintstr) {
//   try {
//     if (!bigintstr) return "";
//     const bn = BigNumber(bigintstr);
//     const hex_sentence = `0x` + bn.toString(16);
//     return shortString.decodeShortString(hex_sentence);
//   } catch (error) {
//     return bigintstr;
//   }
// }

// export function convertToReadableNumber(string) {
//   const num = BigNumber(string).toString(16);
//   const hex_sentence = `0x` + num;
//   return shortString.decodeShortString(hex_sentence);
// }

// export function bigintToLongAddress(bigintstr) {
//   try {
//     if (!bigintstr) return "";
//     const bn = BigNumber(bigintstr);
//     const hex_sentence = `0x` + bn.toString(16);
//     return hex_sentence;
//   } catch (error) {
//     return bigintstr;
//   }
// }

// export const getUint256CalldataFromBN = (bn) => uint256.bnToUint256(bn);

// export const parseInputAmountToUint256 = (input, decimals) =>
//   getUint256CalldataFromBN(parseUnits(input, decimals).value);

// export const parseUnits = (value, decimals) => {
//   let [integer, fraction = ""] = value.split(".");

//   const negative = integer.startsWith("-");
//   if (negative) {
//     integer = integer.slice(1);
//   }

//   // If the fraction is longer than allowed, round it off
//   if (fraction.length > decimals) {
//     const unitIndex = decimals;
//     const unit = Number(fraction[unitIndex]);

//     if (unit >= 5) {
//       const fractionBigInt = BigInt(fraction.slice(0, decimals)) + BigInt(1);
//       fraction = fractionBigInt.toString().padStart(decimals, "0");
//     } else {
//       fraction = fraction.slice(0, decimals);
//     }
//   } else {
//     fraction = fraction.padEnd(decimals, "0");
//   }

//   const parsedValue = BigInt(`${negative ? "-" : ""}${integer}${fraction}`);

//   return {
//     value: parsedValue,
//     decimals,
//   };
// };

// export function timeAgo(timestamp) {
//   const now = Date.now();
//   const timeDifference = now - timestamp;

//   const seconds = Math.floor(timeDifference / 1000);
//   const minutes = Math.floor(seconds / 60);
//   const hours = Math.floor(minutes / 60);
//   const days = Math.floor(hours / 24);
//   const weeks = Math.floor(days / 7);
//   const months = Math.floor(days / 30);
//   const years = Math.floor(days / 365);

//   if (years > 0) {
//     return years === 1 ? "1 year ago" : `${years} years ago`;
//   }
//   if (months > 0) {
//     return months === 1 ? "1 month ago" : `${months} months ago`;
//   }
//   if (weeks > 0) {
//     return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
//   }
//   if (days > 0) {
//     return days === 1 ? "1 day ago" : `${days} days ago`;
//   }
//   if (hours > 0) {
//     return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
//   }
//   if (minutes > 0) {
//     return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
//   }
//   if (seconds > 0) {
//     return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
//   }

//   return "just now";
// }

// // export function multilineToSingleline(multilineString) {
// //   return multilineString.replace(/\n/g, "<br />");
// // }

// export function multilineToSingleline(multilineString) {
//   return multilineString
//     .replace(/\n/g, "<br />")
//     .replace(/\*(.*?)\*/g, "<b>$1</b>") // bold text
//     .replace(/^\s*-\s*(.*?)$/gm, "<li>$1</li>"); // lists
// }

// export function formatDate(timestamp) {
//   const date = new Date(timestamp);

//   const options = {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: true,
//   };

//   return date.toLocaleDateString("en-US", options);
// }

// export function isWithinOneDay(previousTimestamp) {
//   const currentTime = Date.now(); // get current timestamp
//   const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
//   const diffInMs = currentTime - previousTimestamp;
//   return diffInMs <= oneDayInMs;
// }

import { BigNumber } from "bignumber.js";
import { shortString, uint256, Provider, Contract, BigNumberish, Uint256 } from "starknet";
import { NODE_URL } from "./constants";
import { emojiMap, asciiToEmojiMap } from "./EmojiAscii";

/**
 * Convert bigint string to decoded short string
 */
export function bigintToShortStr(
  bigintstr: string | number | undefined
): string {
  try {
    if (!bigintstr) return "";
    const bn = new BigNumber(bigintstr);
    const hex_sentence = `0x${bn.toString(16)}`;
    return shortString.decodeShortString(hex_sentence);
  } catch (error) {
    return String(bigintstr);
  }
}

/**
 * Convert number string to readable decoded short string
 */
export function convertToReadableNumber(input: string | number): string {
  const numHex = new BigNumber(input).toString(16);
  const hex_sentence = `0x${numHex}`;
  return shortString.decodeShortString(hex_sentence);
}

/**
 * Convert bigint string to hexadecimal address
 */
export function bigintToLongAddress(
  bigintstr: string | number | undefined
): string {
  try {
    if (!bigintstr) return "";
    const bn = new BigNumber(bigintstr);
    return `0x${bn.toString(16)}`;
  } catch (error) {
    return String(bigintstr);
  }
}

export const bigintToU256 = (v: BigNumberish): Uint256 => ({
  low: BigInt(v) & 0xffffffffffffffffffffffffffffffffn,
  high: BigInt(v) >> 128n,
})


export const fetchSTRKToUsd = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd"
    );
    const data = await response.json();
    const strkPriceInUsd = data?.starknet?.usd;
    return strkPriceInUsd || 0.0; // Number, e.g., 3425.12
  } catch (error) {
    console.error("Failed to fetch ETH price:", error);
    return null;
  }
};
/**
 * Converts BigNumber to Uint256 calldata
 */
export const getUint256CalldataFromBN = (bn: any) => uint256.bnToUint256(bn);

/**
 * Parses input string value to Uint256
 */
export const parseInputAmountToUint256 = (input: string, decimals: number) =>
  getUint256CalldataFromBN(parseUnits(input, decimals).value);

/**
 * Parses a decimal string value to bigint based on decimals
 */
export const parseUnits = (
  value: string,
  decimals: number
): { value: bigint; decimals: number } => {
  let [integer, fraction = ""] = value.split(".");
  const negative = integer.startsWith("-");

  if (negative) {
    integer = integer.slice(1);
  }

  // Round the fraction if it exceeds the allowed decimals
  if (fraction.length > decimals) {
    const roundingDigit = Number(fraction[decimals]);
    if (roundingDigit >= 5) {
      const rounded = BigInt(fraction.slice(0, decimals)) + BigInt(1);
      fraction = rounded.toString().padStart(decimals, "0");
    } else {
      fraction = fraction.slice(0, decimals);
    }
  } else {
    fraction = fraction.padEnd(decimals, "0");
  }

  const parsed = BigInt(`${negative ? "-" : ""}${integer}${fraction}`);

  return {
    value: parsed,
    decimals,
  };
};

/**
 * Returns a human-readable time ago string
 */
export function timeAgo(timestamp: number | bigint): string {
  const now = Date.now();

  // Convert to number if BigInt
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

  const timeDifference = now - ts;

  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return years === 1 ? "1 year ago" : `${years} years ago`;
  if (months > 0) return months === 1 ? "1 month ago" : `${months} months ago`;
  if (weeks > 0) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  if (days > 0) return days === 1 ? "1 day ago" : `${days} days ago`;
  if (hours > 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  if (minutes > 0)
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  if (seconds > 0)
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;

  return "just now";
}

/**
 * Converts multiline string into single line with HTML
 */
export function multilineToSingleline(multilineString: string): string {
  const withHtml = multilineString
    .replace(/\n/g, "<br />")
    .replace(/\*(.*?)\*/g, "<b>$1</b>") // bold
    .replace(/^\s*-\s*(.*?)$/gm, "<li>$1</li>"); // list items

  // Replace emojis with their ASCII equivalents
  const withEmojisReplaced = withHtml.replace(
    /[\u{1F300}-\u{1FAFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F1E6}-\u{1F1FF}]/gu,
    (match) => {
      return emojiMap[match] || match;
    }
  );

  return withEmojisReplaced;
}

/**
 * Formats timestamp to a full readable date string
 */
export function formatDate(timestamp: number | string): string {
  const date = new Date(Number(timestamp));
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return date.toLocaleDateString("en-US", options);
}

/**
 * Checks if a timestamp is within the last 24 hours
 */
export function isWithinOneDay(previousTimestamp: number): boolean {
  const currentTime = Date.now();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return currentTime - previousTimestamp <= oneDayInMs;
}

/**
 * Truncates an address by showing the first `start` and last `end` characters.
 * @param address - The full address (e.g., Starknet address).
 * @param start - Number of characters to keep from the start.
 * @param end - Number of characters to keep from the end.
 * @returns Truncated address (e.g., "0x123...abcd").
 */
export function truncateAddress(
  address: string,
  start: number = 4,
  end: number = 4
): string {
  if (!address) return "";

  // Validate input
  if (start < 0 || end < 0) {
    throw new Error("Start and end values must be positive.");
  }
  if (start + end >= address.length) {
    return address; // Return full address if truncation isn't possible
  }

  const firstPart = address.substring(0, start);
  const lastPart = address.substring(address.length - end);

  return `${firstPart}...${lastPart}`;
}

// export function htmlToMarkdown(html: string): string {
//   let markdown = html;

//   // Line breaks
//   markdown = markdown.replace(/<br\s*\/?>/gi, "\n");

//   // Bold text
//   markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**");
//   markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");

//   // Italic text
//   markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*");
//   markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*");

//   // Links
//   markdown = markdown.replace(/<a\s+href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)");

//   // List items
//   markdown = markdown.replace(/<li>(.*?)<\/li>/gi, "- $1");
//   markdown = markdown.replace(/<\/ul>|<\/ol>/gi, "");
//   markdown = markdown.replace(/<ul>|<ol>/gi, "\n");

//   // Remove all other tags
//   markdown = markdown.replace(/<[^>]+>/g, "");

//   // Clean up multiple line breaks
//   markdown = markdown.replace(/\n{3,}/g, "\n\n");

//   return markdown.trim();
// }

export function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");

  // Bold text
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");

  // Italic text
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*");

  // Links
  markdown = markdown.replace(/<a\s+href="(.*?)">(.*?)<\/a>/gi, "[$2]($1)");

  // List items
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, "- $1");
  markdown = markdown.replace(/<\/ul>|<\/ol>/gi, "");
  markdown = markdown.replace(/<ul>|<ol>/gi, "\n");

  // Remove all other tags
  markdown = markdown.replace(/<[^>]+>/g, "");

  // Clean up multiple line breaks
  markdown = markdown.replace(/\n{3,}/g, "\n\n");

  // Replace ASCII with emojis
  for (const [ascii, emoji] of Object.entries(asciiToEmojiMap)) {
    const escapedAscii = ascii.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"); // escape for regex
    const regex = new RegExp(escapedAscii, "g");
    markdown = markdown.replace(regex, emoji);
  }

  return markdown.trim();
}

export const weiToEth = (wei, decimals = 6) => {
  const eth = Number(BigInt(wei)) / 1e18;
  return eth.toFixed(decimals);
};

export const toDecimalString = (num) => {
  return Number(num)
    .toFixed(18)
    .replace(/\.?0+$/, "");
};

export const fetchEthToUsd = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = await response.json();
    const ethPriceInUsd = data?.ethereum?.usd;
    return ethPriceInUsd || 0.0; // Number, e.g., 3425.12
  } catch (error) {
    console.error("Failed to fetch ETH price:", error);
    return null;
  }
};

export async function getEthBalance(address: string) {
  // Connect to StarkNet
  const provider = new Provider({ nodeUrl: NODE_URL });

  // ETH contract on StarkNet
  const ETH_CONTRACT_ADDRESS =
    "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

  // Minimal ABI for balanceOf
  const ETH_ABI = [
    {
      name: "balanceOf",
      type: "function",
      inputs: [{ name: "account", type: "felt" }],
      outputs: [{ name: "balance", type: "Uint256" }],
      stateMutability: "view",
    },
  ];
  const eth = new Contract(ETH_ABI, ETH_CONTRACT_ADDRESS, provider);
  const res = await eth.balanceOf(address);
  const balance = uint256.uint256ToBN(res.balance);
  console.log("ETH Balance:", balance.toString());
  return balance.toString();
}
