package com.earnhub.verify.parser

data class ParsedSms(
    val isValid: Boolean,
    val method: String = "",
    val trxId: String = "",
    val amount: Double = 0.0,
    val senderNumber: String = "",
    val balanceAfter: String = "",
    val smsTime: String = "",
    val rawSms: String = "",
    val error: String? = null
)

object SmsParser {

    private val bkashTrxRegex = Regex("""(?:TrxID|Trx ID|TxnID|Txn ID)[:\s]*([A-Z0-9]{8,12})""", RegexOption.IGNORE_CASE)
    private val bkashAmountRegex = Regex("""(?:received|received amount|payment of|Cash In of)?\s*(?:Tk|BDT)\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)
    private val bkashSenderRegex = Regex("""from\s+(01[3-9][0-9]{8})""", RegexOption.IGNORE_CASE)
    private val bkashBalanceRegex = Regex("""Balance\s+(?:Tk|BDT)?\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)

    private val nagadTrxRegex = Regex("""(?:TxnID|Txn ID|TrxID)[:\s]*([A-Z0-9]{7,12})""", RegexOption.IGNORE_CASE)
    private val nagadAmountRegex = Regex("""(?:Cash In|received|amount of)?\s*(?:Tk|BDT)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:from|received)""", RegexOption.IGNORE_CASE)
    private val nagadSenderRegex = Regex("""from\s+(01[3-9][0-9]{8})""", RegexOption.IGNORE_CASE)
    private val nagadBalanceRegex = Regex("""Balance:\s*(?:Tk|BDT)?\s*([0-9,]+(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)

    fun parse(senderAddress: String, body: String): ParsedSms {
        val cleanBody = body.trim()

        // Filter out non-financial messages like OTPs or promotions
        if (cleanBody.contains("OTP", ignoreCase = true) || cleanBody.contains("verification code", ignoreCase = true)) {
            return ParsedSms(isValid = false, rawSms = cleanBody, error = "Security OTP or non-financial SMS ignored")
        }

        val isBkash = senderAddress.contains("bKash", ignoreCase = true) || senderAddress.contains("16247") || cleanBody.contains("bKash", ignoreCase = true)
        val isNagad = senderAddress.contains("Nagad", ignoreCase = true) || senderAddress.contains("16167") || cleanBody.contains("Nagad", ignoreCase = true)

        if (!isBkash && !isNagad) {
            return ParsedSms(isValid = false, rawSms = cleanBody, error = "Not recognized as bKash or Nagad SMS")
        }

        if (isBkash) {
            val trxMatch = bkashTrxRegex.find(cleanBody)?.groupValues?.get(1)
            val amtMatch = bkashAmountRegex.find(cleanBody)?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()
            val senderMatch = bkashSenderRegex.find(cleanBody)?.groupValues?.get(1) ?: ""
            val balMatch = bkashBalanceRegex.find(cleanBody)?.groupValues?.get(1) ?: ""

            if (trxMatch != null && amtMatch != null && amtMatch > 0) {
                return ParsedSms(
                    isValid = true,
                    method = "bKash",
                    trxId = trxMatch.uppercase(),
                    amount = amtMatch,
                    senderNumber = senderMatch,
                    balanceAfter = balMatch,
                    rawSms = cleanBody
                )
            }
        }

        if (isNagad) {
            val trxMatch = nagadTrxRegex.find(cleanBody)?.groupValues?.get(1)
            val amtMatch = nagadAmountRegex.find(cleanBody)?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()
            val senderMatch = nagadSenderRegex.find(cleanBody)?.groupValues?.get(1) ?: ""
            val balMatch = nagadBalanceRegex.find(cleanBody)?.groupValues?.get(1) ?: ""

            if (trxMatch != null && amtMatch != null && amtMatch > 0) {
                return ParsedSms(
                    isValid = true,
                    method = "Nagad",
                    trxId = trxMatch.uppercase(),
                    amount = amtMatch,
                    senderNumber = senderMatch,
                    balanceAfter = balMatch,
                    rawSms = cleanBody
                )
            }
        }

        return ParsedSms(isValid = false, rawSms = cleanBody, error = "TrxID or Amount could not be extracted from SMS")
    }
}
