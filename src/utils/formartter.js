export const slugify = (val) => {
  if (!val) return '';
  return String(val)
    .normalize('NFKD') // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
    .trim() // trim leading or trailing whitespace
    .toLowerCase() // convert to lowercase
    .replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-'); // remove consecutive hyphens
};

export const randomStringSecure = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (x) => chars[x % chars.length]).join('');
};

export const convertName = (str) => {
  if (!str) return "";

  return str
    .split(" ")
    .map(word => {
      // Nếu từ đó là "Iphone" (không phân biệt hoa thường), quy đổi thẳng thành "IP"
      if (word.toLowerCase() === "iphone") {
        return "IP";
      }
      if (word.toLowerCase() === "imac") {
        return "IM";
      }
      if (word.toLowerCase() === "ipad") {
        return "IPA";
      }
      if (word.toLowerCase() === "earpods") {
        return "EP";
      }
      // Nếu là số thì giữ nguyên
      if (!isNaN(word)) {
        return word;
      }
      // Các từ còn lại (Pro, Max, Plus...) thì lấy chữ cái đầu và viết hoa
      return word.charAt(0).toUpperCase();
    })
    .join("");
};
